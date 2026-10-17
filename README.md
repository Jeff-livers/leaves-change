# One-frame video page

A single-screen page: a looping muted video, a two-line phrase, and a song. Tap to turn the sound on or off, and press and hold to pause.

## Updating the page

1. Replace `media/video.mp4` (vertical 9:16, no audio track).
2. Replace `media/song.mp3`.
3. Edit the two text slots in `index.html`, marked `<!-- EDIT: headline -->` and `<!-- EDIT: message -->`.

No other file needs changing.

## Preparing media

Keep the video small so it starts fast on weak signal. Lower the resolution to save size, not the frame rate.

```bash
# video: 720p wide max, no audio track, streams before fully downloaded
ffmpeg -i input.mov -vf "scale='min(720,iw)':-2" -c:v libx264 -profile:v high \
  -crf 28 -preset slow -movflags +faststart -an media/video.mp4

# song: 128k mp3
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k media/song.mp3
```

Aim for `video.mp4` under about 5 MB and `song.mp3` under about 4 MB. Only use music you have the rights to.
# leaves-change
