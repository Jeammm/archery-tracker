export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach(function(track) {
    track.stop();
  });
}