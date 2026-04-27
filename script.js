const CHANNEL_ID = "UC-lHJZR3Gqxm24_Vd_AJ5Yw";
const UPLOADS_PLAYLIST_ID = "UU-lHJZR3Gqxm24_Vd_AJ5Yw";
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const RSS_PROXY = `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_URL)}`;
const FALLBACK_RECENT_VIDEO_IDS = [
  "WtxPV8kwW1o",
  "LVUGbW8BnRw",
  "5nL-Eq1lpDU",
  "aV4j5pXLP-I"
];

const knownCreditSections = [
  {
    heading: "the kjellbergs",
    names: [
      "Felix Kjellberg", "Marzia Kjellberg", "Bjorn Kjellberg", "Edgar Allan Pug",
      "Maya", "Momo Kjellberg", "Mugi", "Ynk", "Slippy", "CutiePieMarzia",
      "PewDiePie", "Pewds", "Pewdie"
    ]
  },
  {
    heading: "the editors",
    names: [
      "Brad Woto", "Sive Morten", "Muhammed Osman", "Brad 1", "Brad 2",
      "Aloona Larionova", "Moa", "The Brad Lineage", "The Blackscreen",
      "The Explosion Cut", "The Tambourine Department", "The LWIAY Desk"
    ]
  },
  {
    heading: "special thanks",
    names: [
      "Jacksepticeye", "CinnamonToastKen", "Markiplier", "MrBeast", "KSI",
      "Jacksfilms", "RoomieOfficial", "Boyinaband", "Emma Blackery", "KickThePJ",
      "Dolan Dark", "Grandayy", "Pyrocynical", "JackSucksAtLife", "h3h3Productions",
      "Cold Ones", "Anthony Padilla", "MoistCr1TiKaL", "Michael Reeves", "Liza Koshy",
      "Logan Paul", "Philip DeFranco", "Ethan Klein", "Hila Klein"
    ]
  },
  {
    heading: "minecraft survivors",
    names: [
      "Sven", "Sven Joergen", "Joergen", "Joergen 2", "Water Sheep", "Dinnerbone",
      "Ikea Tower", "Broland", "The Council of Beetroot", "Pee Pee Poo Poo",
      "Sven's Bridge", "The Nether Portal", "The Meatball", "The Giant Swedish Flag"
    ]
  },
  {
    heading: "the old rituals",
    names: [
      "Bro Army", "Nine Year Olds", "Floor Gang", "Ceiling Gang", "LWIAY",
      "Meme Review", "Fridays with PewDiePie", "Pew News", "YLYL", "Book Review",
      "Tuber Simulator", "Bitch Lasagna", "Congratulations", "The Diamond Play Button",
      "The Ruby Play Button", "The Chair", "The Headset", "The Tambourine",
      "The Brofist", "Zero Deaths", "Subscribe to PewDiePie"
    ]
  }
];

const fanPrefixes = [
  "floor", "bro", "sven", "puga", "meme", "lwiay", "joergen", "tambourine", "pixel", "chair",
  "poods", "edgar", "maya", "momo", "mugi", "broland", "swede", "nineyear", "book", "barrel",
  "lasagna", "ruby", "diamond", "bridge", "kawaii", "vlog", "japan", "quiet", "happy", "after"
];

const fanCores = [
  "kid", "dream", "ghost", "toast", "wave", "garden", "lantern", "signal", "orbit", "button",
  "chapter", "archive", "spark", "slice", "scroll", "pilot", "studio", "coffee", "cloud", "moon",
  "echo", "glitch", "frame", "pocket", "window", "planet", "friend", "summer", "winter", "river"
];

const fanSuffixes = [
  "01", "02", "03", "04", "05", "09", "12", "17", "19", "21",
  "27", "33", "39", "42", "44", "51", "64", "77", "88", "99"
];

let recentVideoIds = [...FALLBACK_RECENT_VIDEO_IDS];
let player;
let playerReady = false;
let youtubeApiReady = false;
const isFileMode = window.location.protocol === "file:";

async function loadRecentVideos() {
  if (isFileMode) return;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 2500);
    const response = await fetch(RSS_PROXY, {
      cache: "no-store",
      signal: controller.signal
    });
    window.clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`RSS proxy returned ${response.status}`);

    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);

    const ids = [...doc.querySelectorAll("entry")]
      .filter((entry) => new Date(entry.querySelector("published")?.textContent || 0) >= cutoff)
      .map((entry) => firstText(entry, "yt:videoId") || firstText(entry, "videoId"))
      .filter(Boolean);

    if (ids.length > 0) {
      recentVideoIds = ids;
      if (playerReady) {
        player.loadPlaylist({
          playlist: recentVideoIds,
          index: 0,
          startSeconds: 24
        });
      }
    }
  } catch (error) {
    console.info("Using uploads playlist fallback:", error);
  }
}

function onYouTubeIframeAPIReady() {
  youtubeApiReady = true;
  createPlayer();
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function createPlayer() {
  if (isFileMode || !youtubeApiReady || player) return;

  const videoIds = recentVideoIds.length > 0 ? recentVideoIds : FALLBACK_RECENT_VIDEO_IDS;

  player = new YT.Player("player", {
    width: "100%",
    height: "100%",
    videoId: videoIds[0],
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      loop: 1,
      modestbranding: 1,
      mute: 1,
      playsinline: 1,
      rel: 0,
      start: 24,
      playlist: videoIds.join(",")
    },
    events: {
      onReady: (event) => {
        playerReady = true;
        event.target.mute();
        event.target.setVolume(36);
        event.target.playVideo();
        hideLoading();
        schedulePlaybackNudges();
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PAUSED) {
          window.setTimeout(() => player?.playVideo(), 300);
        }

        if (event.data === YT.PlayerState.ENDED) {
          playNextVideo();
        }
      },
      onError: () => playNextVideo()
    }
  });
}

function playNextVideo() {
  if (!playerReady || recentVideoIds.length === 0) return;
  player.nextVideo();
}

function schedulePlaybackNudges() {
  [400, 1200, 2600].forEach((delay) => {
    window.setTimeout(() => player?.playVideo(), delay);
  });
}

function firstText(parent, tagName) {
  return parent.getElementsByTagName(tagName)[0]?.textContent?.trim() || "";
}

function buildCredits() {
  const track = document.querySelector("#creditsTrack");
  const dedication = document.createElement("div");
  dedication.className = "credit-dedication";
  dedication.innerHTML = "PewDiePie happily ever after <span>(click anywhere for audio)</span>";

  const list = document.createElement("div");
  list.className = "credit-list";

  [...createRealCreditRows(), ...createFanCreditRows(500)].forEach(({ role, name }) => {
    const row = document.createElement("div");
    row.className = "credit-row";

    const roleCell = document.createElement("span");
    roleCell.className = "credit-role";
    roleCell.textContent = role;

    const nameCell = document.createElement("span");
    nameCell.className = "credit-name";
    nameCell.textContent = name;

    row.append(roleCell, nameCell);
    list.append(row);
  });

  track.replaceChildren(dedication, list);
}

function createRealCreditRows() {
  return knownCreditSections.flatMap((section) => {
    const role = section.heading.replace(/^the /, "");
    return section.names.map((name) => ({ role, name }));
  });
}

function createFanCreditRows(count) {
  return createFanHandles(count).map((name, index) => ({
    role: index % 7 === 0 ? "possible follower" : "long-time bro",
    name
  }));
}

function createFanHandles(count) {
  const handles = [];

  for (let index = 0; handles.length < count; index += 1) {
    const prefix = fanPrefixes[index % fanPrefixes.length];
    const core = fanCores[Math.floor(index / fanPrefixes.length) % fanCores.length];
    const suffix = fanSuffixes[Math.floor(index / (fanPrefixes.length * fanCores.length)) % fanSuffixes.length];
    handles.push(`@${prefix}_${core}_${suffix}`);
  }

  return handles;
}

function hideLoading() {
  document.querySelector("#loading")?.classList.add("is-hidden");
}

function enableSound() {
  if (isFileMode) return;

  if (!playerReady) {
    createPlayer();
    return;
  }

  player.unMute();
  player.setVolume(36);
  player.playVideo();
}

document.querySelector(".stage")?.addEventListener("click", enableSound);

buildCredits();
if (isFileMode) {
  document.body.classList.add("is-file-mode");
  hideLoading();
} else {
  loadRecentVideos();
}

if (!isFileMode && window.YT?.Player) {
  onYouTubeIframeAPIReady();
}
