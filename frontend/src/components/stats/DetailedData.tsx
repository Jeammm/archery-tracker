
export const DetailedData = () => {
  return (
    <div className="p-2">
      <div className="flex flex-col border rounded-lg m-3 p-2 md:flex-row justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <h3>Shot : {1}</h3>
            <div>
              <p>Score {8}</p>
              <p>TTS {2004} ms</p>
              <p>Time {"16:31:56"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p>Head {90}°</p>
              <p>Left shoulder {91}°</p>
              <p>Left elbow {13}°</p>
              <p>Left leg {78}°</p>
            </div>
            <div>
              <p>Hip {90}°</p>
              <p>Right shoulder {91}°</p>
              <p>Right elbow {180}°</p>
              <p>Right leg {70}°</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-[200px] aspect-square border">
            <img
              src="https://www.shutterstock.com/image-illustration/3d-render-male-archer-pose-260nw-1121107496.jpg"
              className="object-cover w-full h-full"
            />
          </div>
          <div className="w-[200px] aspect-square border object-fill">
            <img
              src="https://static.toiimg.com/thumb/resizemode-4,width-1200,height-900,msid-103196097/103196097.jpg"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col border rounded-lg m-3 p-2 md:flex-row justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <h3>Shot : {1}</h3>
            <div>
              <p>Score {8}</p>
              <p>TTS {2004} ms</p>
              <p>Time {"16:31:56"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p>Head {90}°</p>
              <p>Left shoulder {91}°</p>
              <p>Left elbow {13}°</p>
              <p>Left leg {78}°</p>
            </div>
            <div>
              <p>Hip {90}°</p>
              <p>Right shoulder {91}°</p>
              <p>Right elbow {180}°</p>
              <p>Right leg {70}°</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-[200px] aspect-square border">
            <img
              src="https://www.shutterstock.com/image-illustration/3d-render-male-archer-pose-260nw-1121107496.jpg"
              className="object-cover w-full h-full"
            />
          </div>
          <div className="w-[200px] aspect-square border object-fill">
            <img
              src="https://static.toiimg.com/thumb/resizemode-4,width-1200,height-900,msid-103196097/103196097.jpg"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
