import fs from 'fs';
let code = fs.readFileSync('src/useAppConfig.ts', 'utf8');

code = code.replace(/ceritaVideoUrl: "https:\/\/videos\.pexels\.com\/video-files\/856172\/856172-hd_1920_1080_30fps\.mp4",\n\s*facilities: \{/g, `ceritaVideoUrl: "https://videos.pexels.com/video-files/856172/856172-hd_1920_1080_30fps.mp4",
          openTrips: [], visibilities: { map: true, quota: true, beans: true, routes: true }, facilities: {`);

fs.writeFileSync('src/useAppConfig.ts', code);
