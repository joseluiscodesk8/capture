"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../styles/index.module.scss";

type LyricLine = {
  time: number;
  text: string;
};

function parseLRC(lrc: string): LyricLine[] {
  return lrc
    .split("\n")
    .map((line) => {
      const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (!match) return null;

      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);

      return {
        time: minutes * 60 + seconds,
        text: match[3].trim(),
      };
    })
    .filter(Boolean) as LyricLine[];
}

export default function LyricsPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  // 🔧 pega aquí tu LRC
  const lrcText = `
[00:01.72]Uh, come on, uh
[00:05.97]It goes B to the I to the G so proper
[00:08.81]Missy and Big Poppa
[00:10.47]Call us chief rockers
[00:12.01]
[00:12.01]Damn, Ma, I love you like the 'la
[00:14.05]Gonja, sinsemilla, can I feel ya?
[00:18.28]All I wanna do is touch ya
[00:20.29]The ultimate rush, the drugs, baby
[00:23.07]
[00:23.07]Don't you know, I'm the ultimate?
[00:24.33]To get this milk, you be fortunate
[00:26.30]Just like tasting pussy with pork in it
[00:28.42]People stop, when I'm walking in
[00:29.83]I'm twisting, twisting, I'm back on ten
[00:31.73]And I'm talking 'bout like Mase, come back again
[00:33.94]
[00:33.94]My steez is immaculate
[00:35.40]My paper stacking, keep tracking
[00:37.12]I'm macking, y'all slacking, reaction
[00:38.78]Make y'all dicks scream
[00:39.88]I'm more gutter then gold diggers with figures
[00:42.60]More bigger then Jiggas, and even Paris Hilton's
[00:45.42]
[00:45.42]Damn, sir, sniff me like the coke
[00:47.43]Three lines, me won't give you none
[00:50.42]Sinsemilla, all you wanna do is sniff me
[00:53.50]The ultimate rush, get high, baby
[00:56.39]
[00:56.39]Damn, sir, sniff me like the coke
[00:59.19]Three lines, me won't give you none
[01:01.47]Sinsemilla, all you wanna do is sniff me
[01:04.49]The ultimate rush, the drugs, baby
[01:07.54]
[01:07.54]Damn, Ma, I love you like the 'la
[01:09.73]Gonja, sinsemilla, can I feel ya?
[01:13.98]All I wanna do is touch ya
[01:15.83]The ultimate rush, the drugs, baby
[01:18.73]
[01:18.73]Damn, Ma, I love you like the 'la
[01:20.65]Gonja, sinsemilla, can I feel ya?
[01:25.13]All I wanna do is touch ya
[01:27.12]The ultimate rush, the drugs, baby
[01:29.75]
[01:29.75]Now Biggie Smalls is not the type to fall in love
[01:32.18]Wet 'em, hit 'em, and forget 'em and go handle my business
[01:34.96]I like the kind who wine and dine, who grinding all the time
[01:37.64]Your ex girl was a five, but you now you lucked up on a dime, ****
[01:41.32]
[01:40.66]What is this with you? All you wanna do is lay around
[01:43.34]And stay around and get mad when I play around
[01:46.22]I like to lay, never work, put your money in my purse
[01:48.67]To the mall, I'll go search matching shoes for my skirt
[01:52.06]
[01:52.06]Tuesday I saw you in a Z, but you still wanna get with me
[01:55.20]Wednesday is the Benz day, that's what your friends say
[01:58.10]Me and my friends got your Benz
[01:59.80]Attracting mens, and spending dividends, blowing like the wind
[02:03.23]
[02:03.23]Damn, Ma, I love you like the 'la
[02:05.16]Gonja, sinsemilla, can I feel ya?
[02:09.30]All I wanna do is touch ya
[02:11.14]The ultimate rush, the drugs, baby
[02:13.96]
[02:13.96]Damn, Ma, I love you like the 'la
[02:16.28]Gonja, sinsemilla, can I feel ya?
[02:20.56]All I wanna do is touch ya
[02:22.60]The ultimate rush, the drugs, baby
[02:25.08]
[02:25.08]So I guess, you think I'm slipping 'cause I ain't flipping
[02:28.84]Baby, I'm Big Poppa, ain't no need to be tripping
[02:30.92]I ain't tripping or flipping, I'm just **** sipping
[02:33.52]At the bar tipping, with your money, can you pay the difference?
[02:36.44]
[02:36.44]It seems like it's a waste of time, that's why I wrote the rhyme
[02:39.05]I hear you jumping in every car except for mine
[02:41.73]****, I don't jump in cars, I'm a superstar
[02:44.19]Face way too fly, you should hang me on your wall
[02:47.01]
[02:47.01]All I do all day is drink Tanqueray
[02:50.23]Thinking of a way to put a smile on your face
[02:52.52]Make me smile, see them teeth, me look cute down to them features
[02:55.47]My waist, my physique, me don't want to freak a leek
[02:58.12]
[02:58.12]Should I wine and dine you, put rings on your fingers
[03:01.01]While sex from the next man in the bedroom lingers?
[03:03.69]Sex will never linger, hold up, put on your blinkers
[03:06.43]I flow just like sprinklers, give your ass the middle finger
[03:09.30]
[03:09.30]You'd better slow your roll, baby
[03:10.08]You ain't got enough dough to pay me
[03:13.25]You know the pin number, just page me
[03:14.90]When you're real, baby
[03:16.07]
[03:16.07]Damn, Ma, I love you like the 'la
[03:17.24]Gonja, sinsemilla, can I feel ya?
[03:21.49]All I wanna do is touch ya
[03:23.73]The ultimate rush, the drugs, baby
[03:26.50]
[03:26.50]Damn, Ma, I love you like the 'la
[03:28.06]Gonja, sinsemilla, can I feel ya?
[03:32.60]All I wanna do is touch ya
[03:34.55]The ultimate rush, the drugs, baby
[03:37.41]
`;

  useEffect(() => {
    setLyrics(parseLRC(lrcText));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("timeupdate", update);
    return () => audio.removeEventListener("timeupdate", update);
  }, []);

  const getActiveIndex = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) return i;
    }
    return 0;
  };

  const activeIndex = getActiveIndex();

  // 🎯 Auto-scroll centrado
  useEffect(() => {
    const el = lineRefs.current[activeIndex];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeIndex]);

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* 🎵 Audio */}
      <audio
        ref={audioRef}
        controls
        src="/song.mp3" // <-- cambia esto
        className="w-full max-w-md"
      />

      {/* 🎤 Lyrics */}
      <div className={styles.lyrics}>
  {lyrics.map((line, i) => {
    const distance = Math.abs(i - activeIndex);

    let className = styles.line;

    if (i === activeIndex) {
      className += ` ${styles.active}`;
    } else if (distance === 1) {
      className += ` ${styles.near}`;
    } else {
      className += ` ${styles.far}`;
    }

    return (
      <p
        key={i}
        ref={(el) => {
          lineRefs.current[i] = el;
        }}
        className={className}
      >
        {line.text}
      </p>
    );
  })}
</div>
    </div>
  );
}