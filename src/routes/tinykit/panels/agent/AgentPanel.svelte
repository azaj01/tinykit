<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { Button } from "$lib/components/ui/button";
  import Spinner from "$lib/components/Spinner.svelte";
  import TokenCost from "../../components/TokenCost.svelte";
  import {
    FileText,
    Palette,
    Database,
    Code,
    ArrowUp,
    Settings,
    Sparkles,
  } from "lucide-svelte";
  import { pb } from "$lib/pocketbase.svelte";
  import type {
    Message,
    PreviewError,
    TokenUsage,
    PendingPrompt,
  } from "../../types";
  import {
    send_prompt,
    clear_conversation,
    load_spec,
  } from "../../lib/api.svelte";
  import { marked } from "marked";
  import { current_builder_theme } from "$lib/builder_themes";
  import { getProjectContext } from "../../context";

  // Get project_id from context instead of props
  const { project_id } = getProjectContext();

  // Configure marked
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Map common emojis to iconify identifiers
  const emoji_to_icon: Record<string, string> = {
    // Faces & emotions
    "😀": "lucide:smile",
    "😃": "lucide:smile",
    "😄": "lucide:smile",
    "😁": "lucide:smile",
    "😆": "lucide:laugh",
    "😅": "lucide:smile",
    "🤣": "lucide:laugh",
    "😂": "lucide:laugh",
    "🙂": "lucide:smile",
    "🙃": "lucide:smile",
    "😉": "lucide:smile",
    "😊": "lucide:smile",
    "😇": "lucide:smile",
    "🥰": "lucide:heart",
    "😍": "lucide:heart",
    "🤩": "lucide:star",
    "😘": "lucide:heart",
    "😗": "lucide:smile",
    "☺️": "lucide:smile",
    "😚": "lucide:smile",
    "😙": "lucide:smile",
    "🥲": "lucide:smile",
    "😋": "lucide:smile",
    "😛": "lucide:smile",
    "😜": "lucide:smile",
    "🤪": "lucide:smile",
    "😝": "lucide:smile",
    "🤑": "lucide:coins",
    "🤗": "lucide:smile",
    "🤭": "lucide:smile",
    "🤫": "lucide:volume-x",
    "🤔": "lucide:help-circle",
    "🤐": "lucide:lock",
    "🤨": "lucide:scan-eye",
    "😐": "lucide:meh",
    "😑": "lucide:meh",
    "😶": "lucide:meh",
    "😏": "lucide:smile",
    "😒": "lucide:meh",
    "🙄": "lucide:eye",
    "😬": "lucide:meh",
    "🤥": "lucide:x-circle",
    "😌": "lucide:smile",
    "😔": "lucide:frown",
    "😪": "lucide:moon",
    "🤤": "lucide:smile",
    "😴": "lucide:moon",
    "😷": "lucide:shield",
    "🤒": "lucide:thermometer",
    "🤕": "mdi:bandage",
    "🤢": "lucide:frown",
    "🤮": "lucide:frown",
    "🤧": "lucide:frown",
    "🥵": "lucide:thermometer-sun",
    "🥶": "lucide:thermometer-snowflake",
    "🥴": "lucide:meh",
    "😵": "lucide:x",
    "🤯": "lucide:zap",
    "🤠": "lucide:smile",
    "🥳": "lucide:party-popper",
    "🥸": "lucide:glasses",
    "😎": "lucide:glasses",
    "🤓": "lucide:glasses",
    "🧐": "lucide:scan-eye",
    "😕": "lucide:frown",
    "😟": "lucide:frown",
    "🙁": "lucide:frown",
    "☹️": "lucide:frown",
    "😮": "lucide:circle",
    "😯": "lucide:circle",
    "😲": "lucide:circle",
    "😳": "lucide:circle",
    "🥺": "lucide:frown",
    "😦": "lucide:frown",
    "😧": "lucide:frown",
    "😨": "lucide:alert-triangle",
    "😰": "lucide:alert-triangle",
    "😥": "lucide:frown",
    "😢": "lucide:frown",
    "😭": "lucide:frown",
    "😱": "lucide:alert-circle",
    "😖": "lucide:frown",
    "😣": "lucide:frown",
    "😞": "lucide:frown",
    "😓": "lucide:frown",
    "😩": "lucide:frown",
    "😫": "lucide:frown",
    "🥱": "lucide:moon",
    "😤": "lucide:angry",
    "😡": "lucide:angry",
    "😠": "lucide:angry",
    "🤬": "lucide:angry",
    "😈": "lucide:smile",
    "👿": "lucide:angry",
    "💩": "lucide:trash-2",
    "🤡": "lucide:smile",
    "👹": "lucide:skull",
    "👺": "lucide:skull",
    "👻": "lucide:ghost",
    "👽": "lucide:bot",
    "🙈": "lucide:eye-off",
    "🙉": "lucide:ear-off",
    "🙊": "lucide:volume-x",

    // Status & feedback
    "✅": "lucide:check-circle-2",
    "❌": "lucide:x-circle",
    "⚠️": "lucide:alert-triangle",
    "✓": "lucide:check",
    "✔️": "lucide:check",
    "☑️": "lucide:square-check",
    "❗": "lucide:alert-circle",
    "❓": "lucide:help-circle",
    ℹ️: "lucide:info",
    "💯": "lucide:badge-check",

    // Actions & productivity
    "✨": "lucide:sparkles",
    "💡": "lucide:lightbulb",
    "🎯": "lucide:target",
    "🚀": "lucide:rocket",
    "⚡": "lucide:zap",
    "🔥": "lucide:flame",
    "💪": "lucide:dumbbell",
    "🏆": "lucide:trophy",
    "🎉": "lucide:party-popper",
    "🎊": "lucide:party-popper",
    "✏️": "lucide:pencil",
    "🖊️": "lucide:pen",
    "🖋️": "lucide:pen-tool",

    // Files & documents
    "📝": "lucide:file-text",
    "📄": "lucide:file",
    "📃": "lucide:file-text",
    "📑": "lucide:files",
    "📁": "lucide:folder",
    "📂": "lucide:folder-open",
    "🗂️": "lucide:folders",
    "📋": "lucide:clipboard",
    "📎": "lucide:paperclip",
    "🔖": "lucide:bookmark",
    "📌": "lucide:pin",
    "🏷️": "lucide:tag",
    "🗒️": "lucide:sticky-note",
    "📒": "lucide:notebook",
    "📓": "lucide:notebook",
    "📔": "lucide:book",
    "📕": "lucide:book",
    "📗": "lucide:book",
    "📘": "lucide:book",
    "📙": "lucide:book",
    "📚": "lucide:library",

    // Development & tools
    "🔧": "lucide:wrench",
    "🛠️": "lucide:settings",
    "⚙️": "lucide:cog",
    "🔩": "lucide:wrench",
    "🧰": "lucide:briefcase",
    "💻": "lucide:laptop",
    "🖥️": "lucide:monitor",
    "⌨️": "lucide:keyboard",
    "🖱️": "lucide:mouse",
    "🐛": "lucide:bug",
    "🧪": "lucide:flask-conical",
    "🔬": "lucide:microscope",
    "⚗️": "lucide:flask-conical",
    "🧬": "lucide:dna",
    "🤖": "lucide:bot",
    "🧩": "lucide:puzzle",

    // Design & visuals
    "🎨": "lucide:palette",
    "🖼️": "lucide:image",
    "🖌️": "lucide:brush",
    "✒️": "lucide:pen-tool",
    "🌈": "lucide:rainbow",
    "💎": "lucide:gem",
    "💠": "lucide:diamond",

    // Data & charts
    "📊": "lucide:bar-chart",
    "📈": "lucide:trending-up",
    "📉": "lucide:trending-down",
    "📐": "lucide:ruler",
    "📏": "lucide:ruler",
    "🔢": "lucide:hash",
    "#️⃣": "lucide:hash",
    "🧮": "lucide:calculator",
    "📆": "lucide:calendar",
    "📅": "lucide:calendar",
    "🗓️": "lucide:calendar-days",

    // Storage & packages
    "📦": "lucide:package",
    "🗃️": "lucide:archive",
    "🗄️": "lucide:hard-drive",
    "💾": "lucide:save",
    "💿": "lucide:disc",
    "📀": "lucide:disc",
    "🗑️": "lucide:trash-2",

    // Security & privacy
    "🔒": "lucide:lock",
    "🔓": "lucide:unlock",
    "🔐": "lucide:lock-keyhole",
    "🔑": "lucide:key",
    "🗝️": "lucide:key-round",
    "🛡️": "lucide:shield",
    "🔏": "lucide:lock",
    "🛂": "lucide:shield-check",
    "👁️": "lucide:eye",
    "👁️‍🗨️": "lucide:eye",

    // Communication
    "📧": "lucide:mail",
    "✉️": "lucide:mail",
    "📩": "lucide:mail",
    "📨": "lucide:mail-open",
    "📬": "lucide:mailbox",
    "📭": "lucide:mailbox",
    "📮": "lucide:mailbox",
    "💬": "lucide:message-circle",
    "💭": "lucide:message-circle",
    "🗨️": "lucide:message-square",
    "🗯️": "lucide:message-square",
    "📢": "lucide:megaphone",
    "📣": "lucide:megaphone",
    "🔔": "lucide:bell",
    "🔕": "lucide:bell-off",
    "📞": "lucide:phone",
    "📱": "lucide:smartphone",
    "☎️": "lucide:phone",
    "📲": "lucide:smartphone",

    // Media
    "📷": "lucide:camera",
    "📸": "lucide:camera",
    "📹": "lucide:video",
    "🎥": "lucide:video",
    "🎬": "lucide:clapperboard",
    "🎵": "lucide:music",
    "🎶": "lucide:music-2",
    "🎤": "lucide:mic",
    "🎧": "lucide:headphones",
    "🔊": "lucide:volume-2",
    "🔉": "lucide:volume-1",
    "🔈": "lucide:volume",
    "🔇": "lucide:volume-x",
    "▶️": "lucide:play",
    "⏸️": "lucide:pause",
    "⏹️": "lucide:square",
    "⏺️": "lucide:circle",
    "⏭️": "lucide:skip-forward",
    "⏮️": "lucide:skip-back",
    "⏩": "lucide:fast-forward",
    "⏪": "lucide:rewind",
    "🎮": "lucide:gamepad-2",
    "🕹️": "mdi:controller-classic",

    // Navigation & location
    "🌐": "lucide:globe",
    "🌍": "lucide:globe",
    "🌎": "lucide:globe",
    "🌏": "lucide:globe",
    "🏠": "lucide:home",
    "🏡": "lucide:home",
    "🏢": "lucide:building-2",
    "🏬": "lucide:building",
    "🏣": "lucide:building",
    "🏤": "lucide:building",
    "🏥": "mdi:hospital-building",
    "🏦": "mdi:bank",
    "📍": "lucide:map-pin",
    "🗺️": "lucide:map",
    "🧭": "mdi:compass",
    "🚩": "lucide:flag",
    "🏁": "mdi:flag-checkered",
    "🎌": "lucide:flag",

    // Users & social
    "👤": "lucide:user",
    "👥": "lucide:users",
    "👨‍💼": "lucide:user",
    "👩‍💼": "lucide:user",
    "👨‍💻": "lucide:user",
    "👩‍💻": "lucide:user",
    "🧑‍💻": "lucide:user",
    "👨‍🔧": "lucide:user",
    "👩‍🔧": "lucide:user",
    "👨‍🎨": "lucide:user",
    "👩‍🎨": "lucide:user",
    "🤝": "mdi:handshake",
    "👋": "mdi:hand-wave",

    // Commerce & finance
    "💳": "lucide:credit-card",
    "💵": "lucide:banknote",
    "💴": "lucide:banknote",
    "💶": "lucide:banknote",
    "💷": "lucide:banknote",
    "💰": "lucide:coins",
    "💸": "lucide:coins",
    "🛒": "lucide:shopping-cart",
    "🛍️": "lucide:shopping-bag",
    "🏪": "mdi:store",
    "🧾": "mdi:receipt",
    "💹": "lucide:trending-up",
    "💲": "mdi:currency-usd",

    // Time & scheduling
    "⏳": "lucide:hourglass",
    "⌛": "lucide:hourglass",
    "⏰": "mdi:alarm",
    "⏱️": "lucide:timer",
    "⏲️": "lucide:timer",
    "🕐": "lucide:clock",
    "🕑": "lucide:clock",
    "🕒": "lucide:clock",
    "🕓": "lucide:clock",
    "🕔": "lucide:clock",
    "🕕": "lucide:clock",
    "🕖": "lucide:clock",
    "🕗": "lucide:clock",
    "🕘": "lucide:clock",
    "🕙": "lucide:clock",
    "🕚": "lucide:clock",
    "🕛": "lucide:clock",

    // Weather & nature
    "☀️": "lucide:sun",
    "🌞": "lucide:sun",
    "🌙": "lucide:moon",
    "🌛": "lucide:moon",
    "🌜": "lucide:moon",
    "⭐": "lucide:star",
    "🌟": "lucide:star",
    "💫": "lucide:sparkles",
    "☁️": "lucide:cloud",
    "🌧️": "lucide:cloud-rain",
    "⛈️": "lucide:cloud-lightning",
    "🌩️": "lucide:cloud-lightning",
    "🌨️": "lucide:cloud-snow",
    "❄️": "lucide:snowflake",
    "🌊": "lucide:waves",
    "💧": "lucide:droplet",
    "💦": "lucide:droplets",
    "🌱": "lucide:sprout",
    "🌿": "lucide:leaf",
    "🍀": "mdi:clover",
    "🍃": "lucide:leaf",
    "🌲": "mdi:pine-tree",
    "🌳": "mdi:tree",
    "🪴": "mdi:flower",
    "🌸": "mdi:flower",
    "🌺": "mdi:flower",
    "🌻": "mdi:flower",
    "🌼": "mdi:flower",

    // Food (common ones)
    "☕": "lucide:coffee",
    "🍵": "lucide:cup-soda",
    "🍷": "mdi:glass-wine",
    "🍺": "mdi:beer",
    "🍕": "mdi:pizza",
    "🍔": "mdi:hamburger",
    "🍎": "lucide:apple",
    "🍏": "lucide:apple",
    "🎂": "lucide:cake",
    "🍰": "lucide:cake-slice",
    "🍩": "mdi:food-donut",
    "🧁": "lucide:cake",

    // Actions & misc
    "🔄": "lucide:refresh-cw",
    "🔃": "lucide:refresh-cw",
    "🔀": "lucide:shuffle",
    "🔁": "lucide:repeat",
    "🔂": "lucide:repeat-1",
    "↩️": "lucide:undo",
    "↪️": "lucide:redo",
    "📤": "lucide:upload",
    "📥": "lucide:download",
    "🔍": "lucide:search",
    "🔎": "lucide:search",
    "🔗": "lucide:link",
    "⛓️": "lucide:link",
    "➕": "lucide:plus",
    "➖": "lucide:minus",
    "✖️": "lucide:x",
    "➗": "lucide:divide",
    "➡️": "lucide:arrow-right",
    "⬅️": "lucide:arrow-left",
    "⬆️": "lucide:arrow-up",
    "⬇️": "lucide:arrow-down",
    "↗️": "lucide:arrow-up-right",
    "↘️": "lucide:arrow-down-right",
    "↙️": "lucide:arrow-down-left",
    "↖️": "lucide:arrow-up-left",
    "→": "lucide:arrow-right",
    "←": "lucide:arrow-left",
    "↑": "lucide:arrow-up",
    "↓": "lucide:arrow-down",
    "🔙": "lucide:arrow-left",
    "🔚": "lucide:arrow-right",
    "🔛": "lucide:toggle-right",
    "🔜": "lucide:arrow-right",
    "🔝": "lucide:arrow-up",

    // Hearts & love
    "❤️": "lucide:heart",
    "🧡": "lucide:heart",
    "💛": "lucide:heart",
    "💚": "lucide:heart",
    "💙": "lucide:heart",
    "💜": "lucide:heart",
    "🖤": "lucide:heart",
    "🤍": "lucide:heart",
    "🤎": "lucide:heart",
    "💔": "lucide:heart-crack",
    "❤️‍🔥": "lucide:heart",
    "💖": "lucide:heart",
    "💗": "lucide:heart",
    "💓": "lucide:heart-pulse",
    "💕": "mdi:heart-multiple",
    "💞": "lucide:heart",
    "💝": "lucide:gift",
    "👍": "lucide:thumbs-up",
    "👎": "lucide:thumbs-down",

    // Accessibility
    "♿": "lucide:accessibility",

    // Symbols
    "💀": "lucide:skull",
    "☠️": "lucide:skull",
    "⚰️": "lucide:box",
    "🎗️": "mdi:ribbon",
    "🎀": "mdi:ribbon",
    "🎁": "lucide:gift",
    "🧲": "lucide:magnet",
    "🔮": "lucide:circle",
    "🧿": "lucide:eye",
    "🪬": "lucide:eye",
    "💊": "mdi:pill",
    "💉": "mdi:needle",
    "🩺": "mdi:stethoscope",
    "🩹": "mdi:bandage",
    "🏋️": "lucide:dumbbell",
    "🏋️‍♂️": "lucide:dumbbell",
    "🏋️‍♀️": "lucide:dumbbell",
    "⚖️": "lucide:scale",
    "🔨": "mdi:hammer",
    "⚒️": "mdi:pickaxe",
    "⛏️": "mdi:pickaxe",
    "🪓": "mdi:axe",
    "🔪": "lucide:scissors",
    "✂️": "lucide:scissors",
    "🪝": "mdi:hook",
    "⚓": "lucide:anchor",
    "🧲": "mdi:magnet",
    "🔋": "lucide:battery-full",
    "🪫": "lucide:battery-low",
    "🔌": "mdi:power-plug",
    "💡": "lucide:lightbulb",
    "🔦": "mdi:flashlight",
    "🕯️": "lucide:flame",
    "🪔": "lucide:flame",
    "🧯": "mdi:fire-extinguisher",
    "🛢️": "mdi:barrel",
    "💺": "mdi:seat",
    "🪑": "mdi:chair-rolling",
    "🛏️": "mdi:bed",
    "🛋️": "mdi:sofa",
    "🚿": "mdi:shower-head",
    "🛁": "mdi:bathtub",
    "🚽": "mdi:toilet",
    "🧹": "lucide:brush",
    "🧺": "mdi:basket",
    "🧻": "lucide:scroll",
    "🪣": "mdi:bucket",
    "🧼": "lucide:droplet",
    "🫧": "lucide:droplets",
    "🪥": "lucide:brush",
    "🧴": "mdi:bottle-tonic",
    "🧷": "lucide:pin",
    "🧵": "mdi:needle",
    "🧶": "mdi:knitting",
    "🪡": "mdi:needle",
    "👓": "lucide:glasses",
    "🕶️": "lucide:glasses",
    "🥽": "lucide:glasses",
    "🎒": "mdi:bag-personal",
    "👜": "lucide:briefcase",
    "👝": "lucide:wallet",
    "👛": "lucide:wallet",
    "💼": "lucide:briefcase",
    "🧳": "mdi:bag-suitcase",
    "🎓": "mdi:school",
    "🪖": "mdi:hard-hat",
    "⛑️": "mdi:hard-hat",
    "👑": "mdi:crown",
    "🎪": "mdi:tent",
    "⛺": "mdi:tent",
    "🏕️": "mdi:tent",
    "🎠": "mdi:ferris-wheel",
    "🎡": "mdi:ferris-wheel",
    "🎢": "mdi:roller-coaster",

    // Transport
    "🚗": "lucide:car",
    "🚕": "lucide:car-taxi-front",
    "🚙": "lucide:car",
    "🚌": "lucide:bus",
    "🚎": "lucide:bus",
    "🚐": "lucide:bus",
    "🚑": "mdi:ambulance",
    "🚒": "lucide:truck",
    "🚚": "lucide:truck",
    "🚛": "lucide:truck",
    "🚜": "mdi:tractor",
    "🏎️": "lucide:car",
    "🏍️": "lucide:bike",
    "🛵": "lucide:bike",
    "🚲": "lucide:bike",
    "🛴": "lucide:bike",
    "🛹": "mdi:skateboard",
    "✈️": "lucide:plane",
    "🛫": "lucide:plane-takeoff",
    "🛬": "lucide:plane-landing",
    "🚁": "mdi:helicopter",
    "🚀": "lucide:rocket",
    "🛸": "lucide:rocket",
    "🚢": "lucide:ship",
    "⛵": "lucide:sailboat",
    "🛥️": "lucide:ship",
    "🚤": "lucide:ship",
    "🚂": "lucide:train",
    "🚃": "lucide:train",
    "🚄": "lucide:train-front",
    "🚅": "lucide:train-front",
    "🚆": "lucide:train",
    "🚇": "lucide:train",
    "🚈": "lucide:train",
    "🚉": "lucide:train",
    "🚊": "lucide:tram-front",
    "🚝": "lucide:train",
    "🚞": "mdi:train",
    "🚟": "lucide:cable-car",
    "🚠": "lucide:cable-car",
    "🚡": "lucide:cable-car",

    // Animals (common ones used metaphorically)
    "🐝": "mdi:bee",
    "🐞": "mdi:ladybug",
    "🦋": "mdi:butterfly",
    "🐛": "lucide:bug",
    "🐜": "mdi:ant",
    "🦗": "mdi:cricket",
    "🦟": "mdi:mosquito",
    "🕷️": "mdi:spider",
    "🦂": "mdi:scorpion",
    "🐌": "mdi:snail",
    "🐢": "mdi:turtle",
    "🐇": "lucide:rabbit",
    "🦊": "mdi:fox",
    "🐱": "lucide:cat",
    "🐶": "mdi:dog",
    "🐻": "mdi:teddy-bear",
    "🐼": "mdi:panda",
    "🦁": "mdi:lion",
    "🐯": "mdi:cat",
    "🐮": "mdi:cow",
    "🐷": "mdi:pig",
    "🐸": "mdi:frog",
    "🐙": "mdi:octopus",
    "🦑": "mdi:squid",
    "🦐": "mdi:shrimp",
    "🦀": "mdi:crab",
    "🐟": "lucide:fish",
    "🐠": "lucide:fish",
    "🐡": "lucide:fish",
    "🦈": "mdi:shark",
    "🐳": "mdi:whale",
    "🐋": "mdi:whale",
    "🐬": "mdi:dolphin",
    "🐦": "lucide:bird",
    "🐧": "mdi:penguin",
    "🦅": "mdi:bird",
    "🦆": "mdi:duck",
    "🦉": "mdi:owl",
    "🦇": "mdi:bat",
    "🐴": "mdi:horse",
    "🦄": "mdi:unicorn",
    "🐺": "mdi:wolf",
    "🐗": "mdi:pig",
    "🐘": "mdi:elephant",
    "🦏": "mdi:rhino",
    "🦛": "mdi:hippo",
    "🐪": "mdi:camel",
    "🐫": "mdi:camel",
    "🦒": "mdi:giraffe",
    "🦘": "mdi:kangaroo",
    "🐒": "mdi:monkey",
    "🦍": "mdi:gorilla",
    "🦧": "mdi:orangutan",
    "🐕": "mdi:dog",
    "🐩": "mdi:dog",
    "🐈": "lucide:cat",
    "🐓": "mdi:rooster",
    "🦃": "mdi:turkey",
    "🦚": "mdi:peacock",
    "🦜": "mdi:parrot",
    "🦢": "mdi:bird",
    "🦩": "mdi:flamingo",
    "🕊️": "mdi:dove",
    "🐁": "mdi:rodent",
    "🐀": "mdi:rodent",
    "🐿️": "mdi:squirrel",
    "🦔": "mdi:hedgehog",
  };

  function render_markdown(text: string): string {
    // Replace overly enthusiastic/apologetic phrases with neutral tone
    let processed = text;
    processed = processed.replace(
      /You're absolutely right!?/gi,
      "That's correct.",
    );
    processed = processed.replace(/Absolutely right!?/gi, "Correct.");

    // Replace emojis with icon markers before markdown parsing
    for (const [emoji, icon] of Object.entries(emoji_to_icon)) {
      const escaped = emoji.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      processed = processed.replace(
        new RegExp(escaped, "gu"),
        `[[ICON::${icon}]]`,
      );
    }

    // Clean up excessive whitespace
    const cleaned = processed.replace(/\n{3,}/g, "\n\n").trim();

    // Parse markdown
    let html = marked.parse(cleaned) as string;

    // Replace icon markers with iconify-icon web components
    html = html.replace(
      /\[\[ICON::([^\]]+)\]\]/g,
      '<iconify-icon icon="$1" style="vertical-align: -0.125em;color:var(--builder-accent)"></iconify-icon>',
    );

    return html;
  }

  // Detect if current theme is light (for conditional prose styling)
  let is_light_theme = $derived($current_builder_theme?.id === "light");

  // Prose classes that adapt to theme
  let prose_classes = $derived(
    is_light_theme
      ? "prose prose-sm prose-pre:bg-black/5 prose-pre:border prose-pre:border-black/10 prose-code:before:content-none prose-code:after:content-none prose-headings:font-semibold prose-p:my-2 prose-headings:my-2 max-w-none mb-4"
      : "prose prose-invert prose-sm prose-pre:bg-white/[0.025] prose-pre:border prose-pre:border-white/10 prose-code:before:content-none prose-code:after:content-none prose-headings:font-semibold prose-p:my-2 prose-headings:my-2 max-w-none mb-4",
  );

  // Message bubble background that adapts to theme
  let bubble_bg = $derived(
    is_light_theme ? "bg-black/[0.025]" : "bg-white/[0.025]",
  );

  type AgentPanelProps = {
    messages: Message[];
    is_processing: boolean;
    is_loading_messages: boolean;
    vibe_zone_enabled: boolean;
    vibe_zone_visible: boolean;
    vibe_user_prompt: string;
    preview_errors: PreviewError[];
    pending_prompt: PendingPrompt | null;
    on_navigate_to_field: (tab: string, field_name?: string) => void;
    on_config_subtab_change: (subtab: "env" | "endpoints") => void;
    on_file_select: (path: string) => void;
    on_load_data_files: () => Promise<void>;
    on_load_config: () => Promise<void>;
    on_refresh_preview: () => void;
    on_vibe_lounge_toggle: () => void;
    on_vibe_dismiss: () => void;
    on_pending_prompt_consumed: () => void;
    on_code_written: (content: string) => void;
  };

  let {
    messages = $bindable(),
    is_processing = $bindable(),
    is_loading_messages,
    vibe_zone_enabled,
    vibe_zone_visible = $bindable(),
    vibe_user_prompt = $bindable(),
    preview_errors = $bindable(),
    pending_prompt = null,
    on_navigate_to_field,
    on_config_subtab_change,
    on_file_select,
    on_load_data_files,
    on_load_config,
    on_refresh_preview,
    on_vibe_lounge_toggle,
    on_vibe_dismiss,
    on_pending_prompt_consumed,
    on_code_written,
  }: AgentPanelProps = $props();

  let agent_input = $state("");
  let message_container: HTMLDivElement;
  let input_element: HTMLTextAreaElement;
  let llm_configured = $state<boolean | null>(null); // null = loading, true/false = checked

  // localStorage key for persisting draft input
  const draft_key = `tinykit:agent-draft:${project_id}`;
  let auto_scroll = $state(true);
  let user_scrolled_up = $state(false); // Sticky flag: user manually scrolled up during streaming
  let tool_in_progress = $state<string | null>(null);
  let previous_message_length = $state(0);
  let user_dismissed_vibe = $state(false);
  let current_usage = $state<TokenUsage | null>(null);
  let last_chunk_time = $state<number>(Date.now());
  let show_processing_indicator = $state(false);

  // Show "Processing..." indicator after 6 seconds of no activity during processing
  $effect(() => {
    if (!is_processing) {
      show_processing_indicator = false;
      return;
    }

    const interval = setInterval(() => {
      const seconds_since_last_chunk = (Date.now() - last_chunk_time) / 1000;
      show_processing_indicator = seconds_since_last_chunk > 6;
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  });

  // Sync vibe zone visibility to parent (for rendering over preview)
  $effect(() => {
    vibe_zone_visible =
      vibe_zone_enabled && is_processing && !user_dismissed_vibe;
  });

  // Handle dismiss from parent (when user closes vibe zone)
  export function dismiss_vibe() {
    user_dismissed_vibe = true;
  }

  onMount(async () => {
    input_element?.focus();
    // Scroll to bottom when mounting (switching to this tab)
    scroll_to_bottom();
    // Restore draft from localStorage
    const saved_draft = localStorage.getItem(draft_key);
    if (saved_draft) {
      agent_input = saved_draft;
      // Trigger auto-resize after restoring
      setTimeout(() => auto_resize_input(), 0);
    }
    // Check if LLM is configured
    try {
      const res = await fetch("/api/settings/llm-status", {
        headers: { Authorization: `Bearer ${pb.authStore.token}` },
      });
      const data = await res.json();
      llm_configured = data.configured;
    } catch {
      llm_configured = false;
    }
  });

  // Save draft to localStorage when input changes
  $effect(() => {
    if (agent_input) {
      localStorage.setItem(draft_key, agent_input);
    } else {
      localStorage.removeItem(draft_key);
    }
  });

  // Scroll to bottom when messages change
  $effect(() => {
    if (messages.length > 0) {
      scroll_to_bottom();
    }
  });

  // Track hidden prompt instructions (for fix error, etc.)
  let pending_full_prompt = $state<string | null>(null);

  // Handle pending prompt from external sources (e.g., fix error button)
  $effect(() => {
    if (pending_prompt && !is_processing) {
      // Show display version to user, store full version for API
      agent_input = pending_prompt.display;
      pending_full_prompt = pending_prompt.full;
      on_pending_prompt_consumed();
      // Small delay to ensure state is updated before sending
      setTimeout(() => send_message(), 50);
    }
  });

  function handle_keydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send_message();
    }
    // cmd-n to clear conversation
    if ((e.metaKey || e.ctrlKey) && e.key === "n") {
      e.preventDefault();
      clear_messages();
    }
  }

  function auto_resize_input() {
    if (!input_element) return;
    input_element.style.height = "auto";
    input_element.style.height = `${input_element.scrollHeight}px`;
  }

  function scroll_to_bottom() {
    // Don't scroll if user has manually scrolled up during this streaming session
    if (message_container && auto_scroll && !user_scrolled_up) {
      setTimeout(() => {
        if (message_container && !user_scrolled_up) {
          message_container.scrollTop = message_container.scrollHeight;
        }
      }, 100);
    }
  }

  function handle_message_scroll() {
    if (!message_container) return;

    const threshold = 50;
    const scroll_top = message_container.scrollTop;
    const scroll_height = message_container.scrollHeight;
    const client_height = message_container.clientHeight;

    const is_at_bottom = scroll_height - scroll_top - client_height < threshold;
    auto_scroll = is_at_bottom;

    // If user scrolls up during streaming, set sticky flag
    if (!is_at_bottom && is_processing) {
      user_scrolled_up = true;
    }
    // If user scrolls back to bottom, clear the flag
    if (is_at_bottom) {
      user_scrolled_up = false;
    }
  }

  async function send_message() {
    if (!agent_input.trim() || is_processing) return;

    const display_prompt = agent_input.trim();
    // Use full prompt if available (e.g., fix error with hidden instructions), otherwise use display
    const api_prompt = pending_full_prompt || display_prompt;
    pending_full_prompt = null; // Clear after use

    vibe_user_prompt = display_prompt;
    agent_input = "";
    is_processing = true;
    user_dismissed_vibe = false;
    user_scrolled_up = false; // Reset scroll flag for new message
    current_usage = null;
    last_chunk_time = Date.now();
    show_processing_indicator = false;
    // Reset textarea height
    if (input_element) {
      input_element.style.height = "auto";
    }

    // Show display version to user
    messages = [...messages, { role: "user", content: display_prompt }];
    scroll_to_bottom();

    try {
      // Include preview errors in context if any
      const errors_context =
        preview_errors.length > 0
          ? `\n\n[Preview errors detected:\n${preview_errors.map((e) => `- ${e.type}: ${e.message}${e.line ? ` (line ${e.line})` : ""}`).join("\n")}\n]`
          : "";

      preview_errors = []; // Clear errors after including

      // Fetch the current spec
      let spec = "";
      try {
        spec = await load_spec(project_id);
      } catch (err) {
        console.error("Failed to fetch spec:", err);
      }

      // Send full prompt to API (may include hidden instructions)
      const response = await send_prompt(
        project_id,
        [
          ...messages.slice(0, -1),
          { role: "user", content: api_prompt + errors_context },
        ],
        spec,
      );

      if (!response.ok) {
        const error_data = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          error_data.error ||
            `Failed to get response from agent (${response.status})`,
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistant_message = {
        role: "assistant" as const,
        content: "",
        stream_items: [],
      };
      let raw_content = "";
      let stream_items: Array<{
        type: "text" | "tool";
        content?: string;
        name?: string;
        args?: Record<string, any>;
        result?: string;
      }> = [];
      messages = [...messages, assistant_message];
      previous_message_length = 0;

      // Track tool results during streaming
      type ToolResult = { name: string; result: string };
      let accumulated_tool_results: ToolResult[] = [];

      if (reader) {
        let sse_buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Accumulate chunks in buffer (use stream: true for multi-byte chars)
          sse_buffer += decoder.decode(value, { stream: true });

          // Split by SSE message delimiter
          const parts = sse_buffer.split("\n\n");
          // Keep last part in buffer (may be incomplete)
          sse_buffer = parts.pop() || "";

          for (const line of parts) {
            if (line.startsWith("data: ")) {
              let data;
              try {
                data = JSON.parse(line.slice(6));
              } catch (parse_error) {
                console.error("[SSE Parse Error]", parse_error, "Line:", line);
                continue; // Skip malformed messages
              }
              console.log("[Agent Stream]", data);

              // Handle stream errors
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.chunk) {
                raw_content += data.chunk;
                messages[messages.length - 1].content = raw_content;

                // Add text to stream_items (append to last text item if exists, else create new)
                const last_item = stream_items[stream_items.length - 1];
                if (last_item && last_item.type === "text") {
                  last_item.content += data.chunk;
                } else {
                  stream_items.push({ type: "text", content: data.chunk });
                }
                messages[messages.length - 1].stream_items = [...stream_items];

                previous_message_length = raw_content.length;
                messages = messages;
                last_chunk_time = Date.now(); // Track activity
                scroll_to_bottom();
              }

              // Handle tool call streaming start (shows loading immediately)
              if (data.toolCallStart) {
                tool_in_progress = data.toolCallStart.name;
              }

              // Handle tool call complete (has full args)
              if (data.incremental && data.toolCall && !data.toolResult) {
                tool_in_progress = data.toolCall.name;
              }

              // Handle incremental tool results (during streaming)
              if (data.incremental && data.toolResult) {
                const tool_name = data.toolCall?.name || "unknown";
                const tool_args = data.toolCall?.parameters;
                accumulated_tool_results.push({
                  name: tool_name,
                  result: data.toolResult,
                });

                // Add tool to stream_items in order (when result arrives)
                stream_items.push({
                  type: "tool",
                  name: tool_name,
                  args: tool_args,
                  result: data.toolResult,
                });

                // Tool completed, clear in-progress state
                tool_in_progress = null;

                // Immediately update message with tool_calls so buttons appear right away
                if (
                  messages.length > 0 &&
                  messages[messages.length - 1].role === "assistant"
                ) {
                  messages[messages.length - 1].stream_items = [
                    ...stream_items,
                  ];
                  messages[messages.length - 1].tool_calls =
                    accumulated_tool_results.map((tr) => ({
                      name: tr.name,
                      result: tr.result,
                    }));
                  messages = messages; // Trigger reactivity
                }

                // Check if content/design/data was created - notify Preview to update
                const config_tools = [
                  "create_content_field",
                  "create_design_field",
                  "create_data_file",
                  "insert_records",
                ];
                if (config_tools.includes(tool_name)) {
                  await on_load_data_files();
                  window.dispatchEvent(
                    new CustomEvent("tinykit:config-updated"),
                  );
                }

                // Check if write_code tool was called - update preview with new content
                if (tool_name === "write_code") {
                  const code = data.toolCall?.parameters?.code;
                  if (code) {
                    on_code_written(code);
                  }
                  on_refresh_preview();
                }
              }

              // Handle completion with usage data
              if (data.done && data.usage) {
                current_usage = data.usage;
                // Attach usage and tool_calls to the last assistant message
                if (
                  messages.length > 0 &&
                  messages[messages.length - 1].role === "assistant"
                ) {
                  messages[messages.length - 1].usage = data.usage;
                  // Convert accumulated_tool_results to tool_calls format
                  if (accumulated_tool_results.length > 0) {
                    messages[messages.length - 1].tool_calls =
                      accumulated_tool_results.map((tr) => ({
                        name: tr.name,
                        result: tr.result,
                      }));
                  }
                  messages = messages;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const error_message =
        error instanceof Error ? error.message : String(error);
      messages = [
        ...messages,
        {
          role: "assistant",
          content: `Error: ${error_message}`,
        },
      ];
    } finally {
      is_processing = false;
      tool_in_progress = null;
    }
  }

  async function clear_messages() {
    if (confirm("Clear all messages?")) {
      messages = [];
      try {
        await clear_conversation(project_id);
      } catch (error) {
        console.error("Failed to clear agent history:", error);
      }
    }
  }

  // Helper functions for code blocks and tool display
  // Extract field name from tool result string
  function extract_field_name(
    tool_name: string,
    result: string,
  ): string | null {
    if (tool_name === "create_content_field") {
      // Pattern: Created content field "FIELD_NAME" ...
      const match = result.match(/Created content field "([^"]+)"/);
      return match ? match[1] : null;
    }
    if (tool_name === "create_design_field") {
      // Pattern: Created {type} design field "FIELD_NAME" ...
      // e.g. "Created color design field "Primary Color" (--color-primary)"
      const match = result.match(/Created \w+ design field "([^"]+)"/);
      return match ? match[1] : null;
    }
    if (tool_name === "create_data_file") {
      // Pattern: Created collection "COLLECTION_NAME" with X records...
      const match = result.match(/Created collection "([^"]+)"/);
      return match ? match[1] : null;
    }
    if (tool_name === "insert_records") {
      // Pattern: Inserted X records into "COLLECTION_NAME"...
      const match = result.match(/into "([^"]+)"/);
      return match ? match[1] : null;
    }
    return null;
  }
</script>

<div class="h-full flex flex-col text-sm relative">
  <!-- Message History -->
  <div
    bind:this={message_container}
    onscroll={handle_message_scroll}
    class="flex-1 overflow-y-auto p-3 space-y-3"
  >
    {#if is_loading_messages}
      <div
        class="flex flex-col items-center justify-center py-12 text-[var(--builder-text-secondary)]"
      >
        <div
          class="w-8 h-8 border-2 border-[var(--builder-accent)]/90 border-t-[var(--builder-accent)] rounded-full animate-spin mb-3"
        ></div>
        <p class="text-sm">Loading conversation...</p>
      </div>
    {:else if messages.length === 0}
      <div class="text-[var(--builder-text-secondary)] text-center py-12">
        {#if llm_configured === false}
          <div class="flex flex-col items-center gap-4">
            <div
              class="w-12 h-12 rounded-full bg-[var(--builder-bg-tertiary)] flex items-center justify-center"
            >
              <Sparkles class="w-6 h-6 text-[var(--builder-text-muted)]" />
            </div>
            <div>
              <p class="text-lg font-medium text-[var(--builder-text-primary)]">
                AI not configured
              </p>
              <p class="mt-2 max-w-xs mx-auto">
                Add an API key to use the AI assistant, or use templates and
                manual editing.
              </p>
            </div>
            <a
              href="/tinykit/settings"
              class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--builder-accent)] text-white rounded-lg hover:bg-[var(--builder-accent-hover)] transition-colors text-sm font-medium"
            >
              <Settings class="w-4 h-4" />
              Configure AI
            </a>
          </div>
        {:else}
          <p class="text-lg font-medium text-[var(--builder-text-primary)]">
            Welcome to tinykit
          </p>
          <p class="mt-2">Describe what you want to build...</p>
        {/if}
      </div>
    {:else}
      {#each messages as message, idx}
        <div
          in:fade
          class="relative space-y-1 {bubble_bg} p-4 rounded-sm {message.role ===
          'user'
            ? 'border-l-2 border-l-[var(--builder-accent)]'
            : ''}"
        >
          <div class="text-[var(--builder-text-secondary)] text-xs">
            {message.role === "user" ? "You" : "Agent"}
          </div>
          <div class="text-[var(--builder-text-primary)]">
            {#if message.role === "user"}
              <div class={prose_classes}>
                {@html render_markdown(message.content)}
              </div>
            {:else}
              {@const is_streaming =
                idx === messages.length - 1 && is_processing}

              {#if message.stream_items && message.stream_items.length > 0}
                <!-- Render items in stream order -->
                {#each message.stream_items as item, item_idx}
                  {#if item.type === "text"}
                    <div class={prose_classes}>
                      {@html render_markdown(item.content || "")}
                    </div>
                  {:else if item.type === "tool"}
                    {@const tool_name = item.name || "unknown"}
                    {@const field_name = extract_field_name(
                      tool_name,
                      item.result || "",
                    )}
                    <div class="tool-button-container">
                      {#if tool_name === "update_spec"}
                        <!-- Spec updates are silent - no UI shown -->
                      {:else if tool_name === "create_content_field"}
                        <button
                          onclick={() => {
                            on_load_config();
                            on_navigate_to_field(
                              "content",
                              field_name || undefined,
                            );
                          }}
                          class="tool-button tool-button--content tool-button--interactive"
                        >
                          <FileText class="w-3 h-3" />
                          <span>{field_name || "Content"}</span>
                        </button>
                      {:else if tool_name === "create_design_field"}
                        <button
                          onclick={() => {
                            on_load_config();
                            on_navigate_to_field(
                              "design",
                              field_name || undefined,
                            );
                          }}
                          class="tool-button tool-button--design tool-button--interactive"
                        >
                          <Palette class="w-3 h-3" />
                          <span>{field_name || "Design"}</span>
                        </button>
                      {:else if tool_name === "create_data_file" || tool_name === "insert_records"}
                        <button
                          onclick={() => {
                            on_navigate_to_field(
                              "data",
                              field_name || undefined,
                            );
                            on_load_data_files();
                          }}
                          class="tool-button tool-button--data tool-button--interactive"
                        >
                          <Database class="w-3 h-3" />
                          <span>{field_name || "Data"}</span>
                        </button>
                      {:else if tool_name === "write_code"}
                        <button
                          onclick={() => {
                            on_navigate_to_field("code");
                          }}
                          class="tool-button tool-button--code tool-button--interactive"
                        >
                          <Code class="w-3 h-3" />
                          <span>Code</span>
                        </button>
                      {:else}
                        <div in:fade class="tool-button tool-button--success">
                          <iconify-icon icon="lucide:check" class="w-3 h-3"
                          ></iconify-icon>
                          <span>{tool_name}</span>
                        </div>
                      {/if}
                    </div>
                  {/if}
                {/each}
              {:else}
                <!-- Fallback for old messages without stream_items -->
                <div class={prose_classes}>
                  {@html render_markdown(message.content)}
                </div>
              {/if}

              <!-- Show code loading during lull (likely generating code) -->
              {#if is_streaming && show_processing_indicator && message.stream_items}
                {@const has_text = message.stream_items.some(
                  (item) => item.type === "text",
                )}
                {@const has_code = message.stream_items.some(
                  (item) => item.type === "tool" && item.name === "write_code",
                )}
                {#if has_text && !has_code}
                  <div class="tool-button-container">
                    <button
                      onclick={() => {
                        on_navigate_to_field("code");
                      }}
                      class="tool-button tool-button--code tool-button--interactive"
                    >
                      <Spinner size="sm" />
                      <span>Code</span>
                    </button>
                  </div>
                {/if}
              {/if}
              <!-- Token usage display for assistant messages -->
              {#if message.usage && !is_streaming}
                <div class="absolute bottom-2 right-3">
                  <TokenCost usage={message.usage} />
                </div>
              {/if}
            {/if}
          </div>
        </div>
      {/each}
      {#if is_processing}
        <div class="pl-1 text-[var(--builder-text-secondary)]">
          {#if show_processing_indicator}
            <span in:fade class="animate-pulse">Processing...</span>
          {:else}
            <span in:fade class="animate-pulse">Inferring...</span>
          {/if}
        </div>
        <!-- Loading Indicator -->
        <div
          in:fade={{ duration: 200 }}
          out:fade={{ duration: 300 }}
          class="loading-bar-container h-[2px] w-full bg-[var(--builder-border)]/50 relative overflow-hidden mt-3 rounded-[1rem]"
        >
          <div
            class="loading-bar absolute h-full w-1/2 bg-[var(--builder-accent)] rounded-[1rem]"
          ></div>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Input Area -->
  <div class="border-t border-[var(--builder-border)]">
    {#if messages.length > 0}
      <div class="border-b border-[var(--builder-border)] px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onclick={clear_messages}
          class="text-xs font-sans text-[var(--builder-text-secondary)]"
        >
          Clear conversation
        </Button>
      </div>
    {/if}
    <div class="p-4">
      <div class="flex items-start gap-2">
        <span class="text-[var(--builder-accent)] pt-0.5 hidden sm:block"
          >></span
        >
        <textarea
          bind:this={input_element}
          bind:value={agent_input}
          onkeydown={handle_keydown}
          oninput={auto_resize_input}
          placeholder={llm_configured === false
            ? "AI not configured"
            : "Make a todo list"}
          class="mt-[3px] flex-1 bg-transparent text-[var(--builder-text-primary)] placeholder:text-[var(--builder-text-secondary)] placeholder:opacity-50 focus:outline-none font-sans resize-none overflow-hidden min-h-[1.5rem] max-h-[12rem]"
          disabled={is_processing || llm_configured === false}
          rows="1"
        ></textarea>
        <button
          onclick={send_message}
          disabled={is_processing ||
            !agent_input.trim() ||
            llm_configured === false}
          class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors {agent_input.trim() &&
          !is_processing &&
          llm_configured !== false
            ? 'bg-[var(--builder-accent)] text-white'
            : 'bg-[var(--builder-bg-tertiary)] text-[var(--builder-text-secondary)]'}"
        >
          <ArrowUp class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .streaming-text {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Tool button base styles */
  .tool-button-container {
    display: inline-flex;
    margin-right: 6px;
    margin-bottom: 6px;
  }
  .tool-button {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    line-height: 1rem;
    border: 1px solid;
    transition:
      background-color 0.15s,
      border-color 0.15s;
  }

  .tool-button--interactive {
    cursor: pointer;
  }

  /* Code tool (orange - primary accent) */
  .tool-button--code {
    background: color-mix(in srgb, var(--tool-code) 10%, transparent);
    border-color: color-mix(in srgb, var(--tool-code) 20%, transparent);
    color: var(--tool-code);
  }
  .tool-button--code.tool-button--interactive:hover {
    background: color-mix(in srgb, var(--tool-code) 20%, transparent);
    border-color: color-mix(in srgb, var(--tool-code) 30%, transparent);
  }

  /* Content tool (green) */
  .tool-button--content {
    background: color-mix(in srgb, var(--tool-content) 10%, transparent);
    border-color: color-mix(in srgb, var(--tool-content) 20%, transparent);
    color: var(--tool-content);
  }
  .tool-button--content.tool-button--interactive:hover {
    background: color-mix(in srgb, var(--tool-content) 20%, transparent);
    border-color: color-mix(in srgb, var(--tool-content) 30%, transparent);
  }

  /* Design tool (purple) */
  .tool-button--design {
    background: color-mix(in srgb, var(--tool-design) 10%, transparent);
    border-color: color-mix(in srgb, var(--tool-design) 20%, transparent);
    color: var(--tool-design);
  }
  .tool-button--design.tool-button--interactive:hover {
    background: color-mix(in srgb, var(--tool-design) 20%, transparent);
    border-color: color-mix(in srgb, var(--tool-design) 30%, transparent);
  }

  /* Data tool (indigo) */
  .tool-button--data {
    background: color-mix(in srgb, var(--tool-data) 10%, transparent);
    border-color: color-mix(in srgb, var(--tool-data) 20%, transparent);
    color: var(--tool-data);
  }
  .tool-button--data.tool-button--interactive:hover {
    background: color-mix(in srgb, var(--tool-data) 20%, transparent);
    border-color: color-mix(in srgb, var(--tool-data) 30%, transparent);
  }

  /* Success/confirmation (emerald) */
  .tool-button--success {
    background: color-mix(in srgb, var(--tool-success) 10%, transparent);
    border-color: color-mix(in srgb, var(--tool-success) 20%, transparent);
    color: var(--tool-success);
  }

  /* Prevent iOS zoom on input focus */
  textarea {
    font-size: 16px;
  }

  @media (min-width: 768px) {
    textarea {
      font-size: inherit;
    }
  }

  /* Simple code block styling (no syntax highlighting) */
  :global(.prose pre) {
    background: var(--builder-bg-tertiary) !important;
    border: 1px solid var(--builder-border) !important;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
    padding: 1rem;
    overflow-x: auto;
  }

  :global(.prose pre code) {
    font-size: 0.875rem;
    line-height: 1.5;
    background: transparent !important;
    color: var(--builder-text-primary);
    font-family: "Monaco", "Menlo", "Ubuntu Mono", "Courier New", monospace;
  }

  /* Loading bar animation */
  @keyframes slide {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }

  .loading-bar-container {
    mask-image: linear-gradient(
      to right,
      transparent,
      black 20%,
      black 80%,
      transparent
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      black 20%,
      black 80%,
      transparent
    );
  }

  .loading-bar {
    animation: slide 1.5s ease-in-out infinite;
    box-shadow: 0 0 8px var(--builder-accent);
  }
</style>
