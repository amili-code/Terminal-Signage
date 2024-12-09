const express = require('express');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const app = express();
const port = 3000;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n--- Video Display App ---\n');

// گرفتن اطلاعات از کاربر
rl.question('Please enter the total playback time (in seconds): ', (duration) => {
    rl.question('Please enter subtitle text (optional): ', (subtitle) => {
        rl.question('Do you want to display a logo? (y/n): ', (logoResponse) => {
            rl.question('Do you want to display a timeLine? (y/n): ', (timeLineResponse) => {
                if (logoResponse === 'y') {
                    // نمایش فایل‌های لوگو
                    const logoFolder = path.join(__dirname, 'logo');
                    fs.readdir(logoFolder, (err, files) => {
                        if (err) {
                            console.log('Error reading logo folder');
                            rl.close();
                            return;
                        }

                        const logos = files.filter(file => file.endsWith('.png'));
                        if (logos.length === 0) {
                            console.log('No logos found.');
                            rl.close();
                            return;
                        }

                        console.log('\nAvailable logos:');
                        logos.forEach((logo, index) => {
                            console.log(`${index + 1}. ${logo}`);
                        });

                        rl.question('Enter the name of the logo you want to display: ', (selectedLogo) => {
                            if (logos.includes(selectedLogo)) {
                                // ارسال اطلاعات به صفحه HTML
                                rl.close();

                                // ارسال HTML به کاربر
                                app.get('/', (req, res) => {
                                    res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Video Player</title>
                  <style>
                    body, html {
                      margin: 0;
                      padding: 0;
                      overflow: hidden;
                      background-color: black;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      color: white;
                      font-size: 24px;
                      position: relative;
                    }
                    video {
                      width: 100vw;
                      height: 100vh;
                      background-color: black;
                    }
                    .subtitle {
                    position: fixed;
                    bottom: 20px;
                    width: 100%;
                    text-align: center;
                    font-size: 24px;
                    color: white;
                    background-color: rgba(0, 0, 0, 0.5); /* پس‌زمینه ثابت */
                    overflow: hidden; /* جلوگیری از بیرون زدن متن */
                    white-space: nowrap; /* جلوگیری از شکست خطوط */
                    padding: 5px 0; /* فاصله از بالا و پایین */
                    }

                    .subtitle-text {
                    display: inline-block;
                    animation: marquee 10s linear infinite; /* انیمیشن حرکت متن */
                    }

                    @keyframes marquee {
                    0% {
                        transform: translateX(100%); /* شروع از خارج صفحه */
                    }
                    100% {
                        transform: translateX(-100%); /* حرکت به خارج از صفحه */
                    }
                    }

                    @keyframes marquee {
                      from { transform: translateX(100%); }
                      to { transform: translateX(-100%); }
                    }
                    .timer {
                      position: fixed;
                      top: 10px;
                      right: 10px;
                      font-size: 24px;
                      color: white;
                    }
                    .logo {
                      position: absolute;
                      top: 10px;
                      left: 10px;
                      width: 100px;
                      height: auto;
                      z-index: 10;
                    }
                    .timeline-container {
                      position: absolute;
                      bottom: 10px;
                      left: 0;
                      width: 100%;
                      height: 5px;
                      background-color: rgba(255, 255, 255, 0.2);
                      z-index: 5;
                    }
                    .timeline {
                      height: 100%;
                      background-color: #00ff00;
                      width: 0%;
                      transition: width 1s linear;
                    }
                  </style>
                </head>
                <body>
                  <video id="videoPlayer" autoplay muted></video>
                  ${subtitle ? `<div class="subtitle"><span class="subtitle-text">${subtitle}</span></div>` : ''}
                  <div class="timer" id="timerDisplay" style="display:none"></div>
                  <div class="timeline-container">
                    <div class="timeline" id="timeline"></div>
                  </div>
                  <img src="/logos/${selectedLogo}" class="logo" id="logo">
                  <script>
                    const videoPlayer = document.getElementById('videoPlayer');
                    let videoIndex = 0;
                    const duration = ${duration} * 1000; // زمان به میلی‌ثانیه
                    let timeRemaining = ${duration}; // زمان باقی‌مانده به ثانیه
                    const timerDisplay = document.getElementById('timerDisplay');
                    const timeline = document.getElementById('timeline');
                    console.log(${timeLineResponse})
                    
                    // شمارش معکوس تایمر و نوار پیشرفت
                    if(${timeLineResponse} != '' && ${timeLineResponse} != 'n')
                    const countdown = setInterval(() => {
                      timeRemaining--;
                      if (timeRemaining <= 10) {
                        timerDisplay.style.color = 'red';
                      }
                      if (timeRemaining >= 0) {
                        timerDisplay.textContent = timeRemaining + 's';
                        
                        // محاسبه درصد پیشرفت
                        const progress = ((${duration} - timeRemaining) / ${duration}) * 100;
                        timeline.style.width = progress + '%';
                      } else{
                         timeline.style.display = 'none';
                      }
                    }, 1000);

                    // دریافت لیست ویدیوها از سرور
                    fetch('/video-list')
                      .then(response => response.json())
                      .then(videos => {
                        if (videos.length === 0) return;

                        function playNextVideo() {
                          videoPlayer.src = '/videos/' + videos[videoIndex];
                          videoPlayer.play();
                          videoIndex = (videoIndex + 1) % videos.length;
                        }

                        playNextVideo();
                        videoPlayer.onended = playNextVideo;

                        // تنظیم زمان کل پخش
                        setTimeout(() => {
                          videoPlayer.pause();
                          document.body.innerHTML = ''; // صفحه مشکی
                          clearInterval(countdown); // توقف شمارش معکوس
                        }, duration);
                      });
                  </script>
                </body>
                </html>
                `);
                                });

                                // مسیر استاتیک برای دسترسی به ویدیوها و لوگوها
                                app.use('/videos', express.static(path.join(__dirname, 'videos')));
                                app.use('/logos', express.static(path.join(__dirname, 'logo')));

                                // ارسال لیست ویدیوها
                                app.get('/video-list', (req, res) => {
                                    const videoFolder = path.join(__dirname, 'videos');
                                    fs.readdir(videoFolder, (err, files) => {
                                        if (err) {
                                            return res.status(500).send('Error reading video folder');
                                        }
                                        const videos = files.filter(file => file.endsWith('.mp4'));
                                        res.json(videos);
                                    });
                                });

                                app.listen(port, () => {
                                    console.log(`Server running at http://localhost:${port}`);
                                });
                            } else {
                                console.log('Invalid logo name');
                                rl.close();
                            }
                        });
                    });
                } else {
                    // ارسال اطلاعات به صفحه HTML بدون لوگو
                    rl.close();

                    // ارسال HTML به کاربر
                    app.get('/', (req, res) => {
                        res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Video Player</title>
            <style>
              body, html {
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: black;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 24px;
                position: relative;
              }
              video {
                width: 100vw;
                height: 100vh;
                background-color: black;
              }
              .subtitle {
                position: fixed;
                bottom: 20px;
                width: 100%;
                text-align: center;
                font-size: 24px;
                color: white;
                background-color: rgba(0, 0, 0, 0.5);
                overflow: hidden;
                white-space: nowrap;
                ${subtitle.length > 30 ? 'animation: marquee 10s linear infinite;' : ''}
              }
              @keyframes marquee {
                from { transform: translateX(100%); }
                to { transform: translateX(-100%); }
              }
              .timer {
                position: fixed;
                top: 10px;
                right: 10px;
                font-size: 24px;
                color: white;
              }
              .timeline-container {
                position: absolute;
                bottom: 10px;
                left: 0;
                width: 100%;
                height: 5px;
                background-color: rgba(255, 255, 255, 0.2);
                z-index: 5;
              }
              .timeline {
                height: 100%;
                background-color: #00ff00;
                width: 0%;
                transition: width 1s linear;
              }
            </style>
          </head>
          <body>
            <video id="videoPlayer" autoplay muted></video>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
            <div class="timer" id="timerDisplay"></div>
            <div class="timeline-container">
              <div class="timeline" id="timeline"></div>
            </div>
            <script>
              const videoPlayer = document.getElementById('videoPlayer');
              let videoIndex = 0;
              const duration = ${duration} * 1000; // زمان به میلی‌ثانیه
              let timeRemaining = ${duration}; // زمان باقی‌مانده به ثانیه
              const timerDisplay = document.getElementById('timerDisplay');
              const timeline = document.getElementById('timeline');

              // شمارش معکوس تایمر و نوار پیشرفت
              const countdown = setInterval(() => {
                timeRemaining--;
                if (timeRemaining <= 10) {
                  timerDisplay.style.color = 'red';
                }
                if (timeRemaining >= 0) {
                  timerDisplay.textContent = timeRemaining + 's';
                  // محاسبه درصد پیشرفت
                  const progress = ((${duration} - timeRemaining) / ${duration}) * 100;
                  timeline.style.width = progress + '%';
                }
              }, 1000);

              // دریافت لیست ویدیوها از سرور
              fetch('/video-list')
                .then(response => response.json())
                .then(videos => {
                  if (videos.length === 0) return;

                  function playNextVideo() {
                    videoPlayer.src = '/videos/' + videos[videoIndex];
                    videoPlayer.play();
                    videoIndex = (videoIndex + 1) % videos.length;
                  }

                  playNextVideo();
                  videoPlayer.onended = playNextVideo;

                  // تنظیم زمان کل پخش
                  setTimeout(() => {
                    videoPlayer.pause();
                    document.body.innerHTML = ''; // صفحه مشکی
                    clearInterval(countdown); // توقف شمارش معکوس
                  }, duration);
                });
            </script>
          </body>
          </html>
          `);
                    });

                    // مسیر استاتیک برای دسترسی به ویدیوها
                    app.use('/videos', express.static(path.join(__dirname, 'videos')));

                    // ارسال لیست ویدیوها
                    app.get('/video-list', (req, res) => {
                        const videoFolder = path.join(__dirname, 'videos');
                        fs.readdir(videoFolder, (err, files) => {
                            if (err) {
                                return res.status(500).send('Error reading video folder');
                            }
                            const videos = files.filter(file => file.endsWith('.mp4'));
                            res.json(videos);
                        });
                    });

                    app.listen(port, () => {
                        console.log(`Server running at http://localhost:${port}`);
                    });
                }
            });
        })
    });
});
