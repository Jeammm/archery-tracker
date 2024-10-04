from datetime import datetime, timedelta

def calculate_time_from_video_frame(start_time: datetime, frame: int, frame_rate: int) -> str:
    # Calculate the time in seconds based on the frame rate
    seconds = frame / frame_rate
    
    # Calculate the timestamp by adding the seconds to the start time
    timestamp = start_time + timedelta(seconds=seconds)
    
    # Return the formatted time as a string
    return timestamp.strftime('%Y-%m-%d %H:%M:%S')