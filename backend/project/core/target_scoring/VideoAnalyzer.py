from project.core.target_scoring import HomographicMatcher as matcher, utils
from project.core.target_scoring import VisualAnalyzer as visuals
from project.core.target_scoring import GroupingMetre as grouper
from project.core.target_scoring import Geometry2D as geo2D
from project.core.target_scoring import HitsManager as hitsMngr
import numpy as np
import cv2

HOMOGRAPHY_LIFE_SPAN = 24

class VideoAnalyzer:
    def __init__(self, videoPath, model, bullseye, ringsAmount, diamPx):
        '''
        {String} videoName - The path of the video to analyze
        {Numpy.array} model - An image of the target that appears in the video
        {Tuple} bullseye - (
                              {Number} x coordinate of the bull'seye location in the model image,
                              {Number} y coordinate of the bull'seye location in the model image
                           )
        {Number} ringsAmount - Amount of rings in the target
        {Number} diamPx - The diameter of the most inner ring in the target image [px]
        '''

        self.cap = cv2.VideoCapture(videoPath)
        _, test_sample = self.cap.read()
        frameSize = test_sample.shape
        self.rings_amount = ringsAmount
        self.inner_diam = diamPx
        self.model = model
        self.frame_h, self.frame_w, _ = frameSize
        self.sift = cv2.SIFT_create()

        # calculate anchor points and model features
        self.anchor_points, self.pad_model = geo2D.zero_pad_as(model, frameSize)
        anchor_a = self.anchor_points[0]
        bullseye_anchor = (anchor_a[0] + bullseye[0],anchor_a[1] + bullseye[1])
        self.anchor_points.append(bullseye_anchor)
        self.anchor_points = np.float32(self.anchor_points).reshape(-1, 1, 2)
        self.model_keys, self.model_desc = self.sift.detectAndCompute(self.pad_model, None)
        
        self.warped_img = None
        self.bullseye_point = None
        self.warped_vertices = []
        self.scale = None
        self.homography_setup_done = False
        self.frame_life = 0
        self.frame_count = 0

    def _setup_homography(self, frame):
        matches, (train_keys, train_desc) = matcher.ratio_match(self.sift, self.model_desc, frame, .7)
        if len(matches) >= 4:
            homography = matcher.calc_homography(self.model_keys, train_keys, matches)

            # check if homography succeeded and start warping the model over the detected object
            if type(homography) != type(None):
                warped_transform = cv2.perspectiveTransform(self.anchor_points, homography)
                self.warped_vertices, warped_edges = geo2D.calc_vertices_and_edges(warped_transform)
                self.bullseye_point = self.warped_vertices[5]

                # check if homography is good enough to continue
                if matcher.is_true_homography(self.warped_vertices, warped_edges, (self.frame_w, self.frame_h), .2):
                    # warp the input image over the filmed object and calculate the scale difference
                    self.warped_img = cv2.warpPerspective(self.pad_model, homography, (self.frame_w, self.frame_h))
                    self.scale = geo2D.calc_model_scale(warped_edges, self.model.shape)
                    self.homography_setup_done = True
                    self.frame_life = 0
                    return True
        
        # If homography setup failed
        self.homography_setup_done = False
        return False  # Indicating no match was found

    def _analyze_frame(self, frame):
        '''
        Analyze a single frame.

        Parameters:
            {Numpy.array} frame - The frame to analyze

        Returns:
            {Tuple} (
                        {Number} x coordinate of the bull'seye point in the target,
                        {Number} y coordinate of the bull'seye point in the target,
                    ),
            {list} [
                       {tuple} (
                                   {tuple} (
                                              {Number} x coordinates of the hit,
                                              {Number} y coordinates of the hit
                                           ),
                                   {Number} The hit's score according to the target's data
                               )
                       ...
                   ],
        '''

        # set default analysis meta-data
        # scoreboard = []
        # scores = []
        # self.bullseye_point = None
        
        # while (not self.warped_img or not self.bullseye_point or not self.warped_vertices or not self.scale):
        
        while not self.homography_setup_done or self.frame_life > HOMOGRAPHY_LIFE_SPAN:
        # if True:
            success = self._setup_homography(frame)
            print("processing...")
            if not success:
                print("homo failed")
                return None, []
        
        # process image
        sub_target = visuals.subtract_background(self.warped_img, frame)
        pixel_distances = geo2D.calc_distances_from(frame.shape, self.warped_vertices[5])
        estimated_warped_radius = self.rings_amount * self.inner_diam * self.scale[2]
        
        
        circle_radius, emphasized_lines = visuals.emphasize_lines(sub_target, pixel_distances,
                                                        estimated_warped_radius, self.frame_life, HOMOGRAPHY_LIFE_SPAN)
        
        proj_contours = visuals.reproduce_proj_contours(emphasized_lines, pixel_distances,
                                                       self.warped_vertices[5], circle_radius)
                
        suspect_hits = visuals.find_suspect_hits(proj_contours, self.warped_vertices, self.scale)

        # calculate hits and draw circles around them
        scoreboard = hitsMngr.create_scoreboard(suspect_hits, self.scale, self.rings_amount, self.inner_diam, self.frame_count)
            
        self.frame_life += 1

        return self.bullseye_point, scoreboard

    def analyze(self, outputName, sketcher, start_time, video_fps):
        '''
        Analyze a video completely and output the same video, with additional data written in it.

        Parameters:
            {String} outputName - The path of the output file
            {Sketcher} sketcher - A Sketcher object to use when writing the data to the output video
        '''

        # set output configurations
        frame_size = (self.frame_w, self.frame_h)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(outputName, fourcc, 24.0, frame_size)

        while True:
            ret, frame = self.cap.read()
            self.frame_count += 1

            if ret:
                bullseye, scoreboard = self._analyze_frame(frame)
                
                # increase reputation of consistent hits
                # or add them as new candidates
                for hit in scoreboard:
                    hitsMngr.sort_hit(hit, 30, HOMOGRAPHY_LIFE_SPAN * 2)
                
                # decrease reputation of inconsistent hits
                hitsMngr.discharge_hits()
                
                # stabilize all hits according to the slightly shifted bull'seye point
                if type(bullseye) != type(None):
                    hitsMngr.shift_hits(bullseye)

                # reference hit groups
                candidate_hits = hitsMngr.get_hits(hitsMngr.CANDIDATE)
                verified_hits = hitsMngr.get_hits(hitsMngr.VERIFIED)

                # extract grouping data
                grouping_contour = grouper.create_group_polygon(frame, verified_hits)
                has_group = type(grouping_contour) != type(None)
                grouping_diameter = grouper.measure_grouping_diameter(grouping_contour) if has_group else 0
                    
                # write meta data on frame
                sketcher.draw_data_block(frame)
                # sketcher.draw_meta_data_block(frame)
                verified_scores = [h.score for h in verified_hits]
                arrows_amount = len(verified_scores)
                sketcher.type_arrows_amount(frame, arrows_amount, (0x0,0x0,0xff))
                sketcher.type_total_score(frame, sum(verified_scores), arrows_amount * 10, (0x0,189,62))
                sketcher.type_grouping_diameter(frame, grouping_diameter, (0xff,133,14))
                
                # mark hits and grouping
                sketcher.draw_grouping(frame, grouping_contour)
                sketcher.mark_hits(frame, candidate_hits, foreground=(0x0,0x0,0xff),
                                   diam=2, withOutline=False, withScore=False)
                
                sketcher.mark_hits(frame, verified_hits, foreground=(0x0,0xff,0x0),
                                   diam=5, withOutline=True, withScore=True)
                sketcher.shot_label_table(frame, verified_hits)
                
                # write frame to output file
                out.write(frame)

            else:
                break
                
        # close window properly
        self.cap.release()
        out.release()
        # cv2.destroyAllWindows()
        # cv2.waitKey(1)
        
        return [
            {
                "id": hit.id, 
                "point": hit.point, 
                "score": hit.score, 
                "frame": hit.frame_count,
                "hit_time": utils.calculate_time_from_video_frame(
                    start_time, hit.frame_count, video_fps
                ),
                "bullseye_relation": hit.bullseye_relation.tolist()
            }
            for hit in hitsMngr.verified_hits
        ]