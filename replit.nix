{pkgs}: {
  deps = [
    pkgs.postgresql
    pkgs.graphicsmagick
    pkgs.imagemagick
    pkgs.ffmpeg
    pkgs.libuuid
  ];
}
