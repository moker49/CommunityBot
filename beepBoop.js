//-----------DEBUG VARIABLES //-----------
const update_roles = true;
const tick = true;
const write_to_disk = true;
const update_teamcount_from_chat = true;
//-----------DEBUG VARIABLES //-----------

const { Console, groupCollapsed } = require("console");
const Discord = require("discord.js");
const fs = require("fs");
const config = require("./config.json");

const CommunityMember = require("./CommunityMember");
const Shop = require("./shop");

const CLIENT = new Discord.Client();
const GUILD_ID = "90057012959780864"; // niggapuff serverId
let guild;

const BOT_ID = "763501654581837835";
const AFK_CHANNEL_ID = "805678356880031774";

const BOT_CHANNEL_ID = "763530028142166028"; //bots: 763530028142166028
const COMMUNITY_CHANNEL_ID = "805284193289502720";
let bot_channel;
let community_channel;

//don't do earnXp from these channels:
const TEAM_COUNTING_CHANNEL_ID = "806603751694663732";
const LOTTERY_CHANNEL_ID = "813978313487679528";
const SHOP_CHANNEL_ID = "814165440355762236";
let team_counting_channel;
let lottery_channel;
let shop_channel;

const COLOR_PINK = 0xe85098;
const COLOR_POSITIVE = 0x20c002;
const COLOR_NEGATIVE = 0xc02020;

let xp_mult = 1;
const XP_SHIFT = 40;
const XP_CURVE = 60;
const DEFAULT_XP_THRESHOLD = XP_SHIFT + XP_CURVE;
const VOICE_XP_BASE = 4;
const VOICE_XP_MULT = 2;
const VOICE_XP_MIN_MEMBERS = 2;
const VOICE_XP_MAX_MEMBERS = 11;
const VOICE_XP_PAST_MAX = 100;
const CHAR_XP = 5;
const LINK_XP = 50;
const SOFT_LEVEL_CAP = 150;

let team_count = 2173;
const count_gold_gain = 1;
const count_base_xp = 20;
const mod100_xp = 100;
const mod1000_xp = 1000;

let game_clock;
let info_clock;
const GAME_TICK_COOLDOWN = 60000;
const UPDATE_INFO_COOLDOWN = 360000;

const DEFAULT_LEADERBOARD_SIZE = 10;
const PROGRESS_BAR_CHUNKS = 19;
const PROGRESS_BAR_EMPTY = "▱";
const PROGRESS_BAR_FULL = "▰";
const COMMUNITY_ICON = "https://i.imgur.com/xk1UydC.png";
const CURRENCY_ICON = "https://i.imgur.com/j3JjzTc.png";
const LEVEL_BADGES = [
	"https://i.imgur.com/5GDjRSC.png",
	"https://i.imgur.com/xKrjPO7.png",
	"https://i.imgur.com/RwbNumd.png",
	"https://i.imgur.com/GopeJaH.png",
	"https://i.imgur.com/DRIZYn7.png",
	"https://i.imgur.com/mIESQhl.png",
	"https://i.imgur.com/o8oGvWa.png",
	"https://i.imgur.com/8Uo46L3.png",
	"https://i.imgur.com/8HrdMrU.png",
	"https://i.imgur.com/YUhOnAq.png",
	"https://i.imgur.com/usMX6Kd.png",
	"https://i.imgur.com/WVGycNO.png",
	"https://i.imgur.com/HZQjW1Z.png",
	"https://i.imgur.com/vJ6K4W0.png",
	"https://i.imgur.com/BzatIv6.png",
	"https://i.imgur.com/gYbqxsi.png",
	"https://i.imgur.com/Mcx18ct.png",
	"https://i.imgur.com/y3foOhj.png",
	"https://i.imgur.com/M897An3.png",
	"https://i.imgur.com/ZSpteAF.png",
	"https://i.imgur.com/Nt2er3b.png",
	"https://i.imgur.com/14sePwg.png",
	"https://i.imgur.com/1dQTiMZ.png",
	"https://i.imgur.com/nYM8iMt.png",
	"https://i.imgur.com/XvuUium.png",
	"https://i.imgur.com/qFFUqO8.png",
	"https://i.imgur.com/SzHZRhX.png",
	"https://i.imgur.com/wY4g5l4.png",
	"https://i.imgur.com/9PcgljQ.png",
	"https://i.imgur.com/0aBx5y6.png",
	"https://i.imgur.com/awxjy2b.png",
];

let community_members = [];
let on_voice = new Set();
console.log("Bot not ready");

loadCommunityMembersFromDisk();

CLIENT.on("ready", async () => {
	createNewMembers();
	writeCommunityMembersToDisk();
	setGuildAndChannels();
	setCount();

	if (tick) {
		game_clock = setInterval(gameTick, GAME_TICK_COOLDOWN);
		info_clock = setInterval(updateInfo, UPDATE_INFO_COOLDOWN);
	}

	updateVoiceList();
	console.log("Bot ready");
	doSomethingOnce();
});

CLIENT.on("message", async (input_msg) => {
	let bot_log_message = "";

	if (input_msg.author.bot) {
		return;
	}
	if (input_msg && !isCommand(input_msg)) {
		if (input_msg.channel.id == TEAM_COUNTING_CHANNEL_ID) {
			teamCount(input_msg);
		} else if (input_msg.channel.id == lottery_channel) {
		} else {
			earnXp(input_msg.author.id, calculateXP(input_msg.content));
		}
	} else {
		const command_msg_clean = cleanString(input_msg.content);
		const args = command_msg_clean.split(/ +/g);
		const command = args.shift().slice(config.prefix.length).toLowerCase();
		const from_channel = input_msg.channel;

		bot_log_message += "```" + command_msg_clean + "```";
		const bot_log_embed = new Discord.MessageEmbed();

		try {
			switch (command) {
				case "buy":
					if (from_channel == shop_channel) {
						argsExist(args, 1, "Usage: `" + config.prefix + "buy <item name>. `");
						buyItem;
					}
					break;
				case "c":
				case "char":
					sendEmbedLevel(input_msg, from_channel);
					sendEmbedStats(input_msg, from_channel);
					break;
				case "givexp":
					checkPermissions(input_msg.member, ["MANAGE_MESSAGES"]);
					argsExist(args, 2, "Usage: `" + config.prefix + "givexp <userId> <xp>. `");
					memberExists(args[0]);
					xp = parseInt(args[1]);
					giveXp(args[0], xp);
					break;
				case "i":
				case "inv":
					sendEmbedInventory(input_msg, from_channel);
					break;
				case "inspect":
					if (from_channel == shop_channel) {
						argsExist(args, 1, "Usage: `" + config.prefix + "inspect <item name>. `");
					}
					break;
				case "l":
				case "level":
					sendEmbedLevel(input_msg, from_channel);
					break;
				case "lb":
					sendEmbedLeaderboard(from_channel, args[0]);
					break;
				case "move":
					checkPermissions(input_msg.member, ["MANAGE_MESSAGES"]);
					argsExist(args, 2, "Usage: `" + config.prefix + "move <Destination Channel> <Message ID> <Message ID> ..`");
					let to_channel = input_msg.guild.channels.cache.get(args[0].replace(/<#|>/g, ""));
					checkChannelExists(to_channel);
					for (i = 1; i < args.length; i++) {
						moveMessage(from_channel, to_channel, args[i]);
					}
					break;
				case "save":
					writeCommunityMembersToDisk();
					break;
				case "sell":
					if (from_channel == shop_channel) {
						argsExist(args, 1, "Usage: `" + config.prefix + "sell <item name>. `");
					}
					break;
				case "shop":
					if (from_channel == shop_channel) {
						sendEmbedShop();
					}
					break;
				case "s":
				case "stats":
					sendEmbedStats(input_msg, from_channel);
					break;
				case "tick":
					checkPermissions(input_msg.member, ["MANAGE_MESSAGES"]);
					gameTick();
					break;
				case "tickcd":
					checkPermissions(input_msg.member, ["MANAGE_MESSAGES"]);
					argsExist(args, 1, "Usage: `" + config.prefix + "tickcd <tick cd(in milisec)>. `");
					clearInterval(game_clock);
					game_clock = setInterval(gameTick, args[0]);
					break;
				case "xpmult":
					checkPermissions(input_msg.member, ["MANAGE_MESSAGES"]);
					argsExist(args, 1, "Usage: `" + config.prefix + "xpmult <xp multiplier>. `");
					xp_mult = parseInt(args[0]);
					break;
				default:
					throw "Unknown command.\n\n\
							Economy commands: `lb` `level` `stats` `inv` `c` \n\
							Elevated commands: `tick` `tickcd` `xpmult` `givexp` `save` \n\
							Server commands: `move`";
			}

			bot_log_embed.setColor(COLOR_POSITIVE);
		} catch (e) {
			bot_log_embed.setColor(COLOR_NEGATIVE);
			bot_log_message += e;
		} finally {
			bot_log_embed
				.setAuthor(input_msg.author.tag + " #" + from_channel.name)
				.setDescription(bot_log_message)
				.setTimestamp();
			await bot_channel.send(bot_log_embed);
			input_msg.delete();
		}
	}
});

CLIENT.on("voiceStateUpdate", (oldState, newState) => {
	if (newState.channelID && newState.channelID != AFK_CHANNEL_ID) {
		on_voice.add(newState.member.id);
	} else if (!newState.channelID) {
		on_voice.delete(oldState.member.id);
	} else if (newState.channelID == AFK_CHANNEL_ID) {
		on_voice.delete(newState.member.id);
	}
});

CLIENT.on("guildMemberAdd", (member) => {
	createNewMembers();
});

function isCommand(input_msg) {
	return input_msg.content.indexOf(config.prefix) === 0;
}

function teamCount(input_msg) {
	let atempt = +input_msg.content;
	let next = team_count + 1;
	if (!atempt) {
		input_msg.delete();
		return;
	}
	if (atempt == next) {
		team_count = next;
		let xp = countXp(next, input_msg);
		giveXp(input_msg.author.id, xp_mult * xp, false);
		giveGold(input_msg.author, count_gold_gain);
	} else if (next > attempt > next - 10) {
		//team_count = next;
		let xp = count_base_xp;
		giveXp(input_msg.author.id, xp_mult * xp);
		giveGold(input_msg.author, count_gold_gain);
		input_msg.delete();
	} else {
		input_msg.delete();
	}
}

function countXp(count, input_msg) {
	let xp = count_base_xp;
	if (count % 1000 == 0) {
		xp += mod1000_xp;
		alertCount(input_msg, mod1000_xp);
	} else if (count % 100 == 0) {
		xp += mod100_xp;
		alertCount(input_msg, mod100_xp);
	}
	return xp;
}

async function alertCount(input_msg, xp) {
	const embed = new Discord.MessageEmbed()
		.setTitle(`${input_msg}!`)
		.setAuthor(input_msg.member.displayName, input_msg.author.avatarURL())
		.setColor(COLOR_PINK)
		.setFooter(`+${xp} bonus xp!`);
	await team_counting_channel.send(embed);
}

function giveGold(memberId, gold) {
	let member = getMember(memberId);
	member.giveGold(gold);
}

function updateVoiceList() {
	let voice;
	guild.members.cache.forEach((member) => {
		voice = member.voice;
		if (voice && voice.channelID && voice.channelID != AFK_CHANNEL_ID) {
			on_voice.add(member.id);
		}
	});
}

function checkPermissions(user, permissions) {
	permissions.forEach((permission) => {
		if (!user.permissions.has(permission)) {
			throw `You need the following permission for this command: ${permission}`;
		}
	});
}

function argsExist(args, expected_args, err_msg) {
	for (let i = 0; i < expected_args; i++) {
		if (!args[i]) throw err_msg;
	}
}

function memberExists(userId) {
	if (!getMember(userId)) {
		throw "Community member not found.";
	}
}

function checkChannelExists(channel) {
	if (!channel) {
		throw "Channel not found.";
	}
}

function updateRole(id) {
	if (update_roles) {
		let role_recipient = guild.members.cache.get(id);
		let level = getMember(id).level;
		let level_base = Math.trunc(Math.min(SOFT_LEVEL_CAP, level) / 10);
		let new_role_name = `LVL${level_base}0+`;
		let old_role_name = `LVL${level_base - 1}0+`;

		try {
			let old_role = guild.roles.cache.find((role) => role.name == old_role_name);
			role_recipient.roles.remove(old_role.id);
		} catch (err) {}
		try {
			let new_role = guild.roles.cache.find((role) => role.name == new_role_name);
			role_recipient.roles.add(new_role.id);
		} catch (err) {}
	}
}

async function sendEmbedLevel(input_msg, destinationChannel = community_channel) {
	let { level, xp, xp_threshold } = getMember(input_msg.author.id);
	let badge_level = Math.min(level, SOFT_LEVEL_CAP);
	const embed = new Discord.MessageEmbed()
		.setTitle(`Level ${level}`)
		.setAuthor(input_msg.member.displayName, input_msg.author.avatarURL())
		.setColor(COLOR_PINK)
		.setDescription(getProgressBar(level, xp, xp_threshold))
		.setThumbnail(LEVEL_BADGES[Math.trunc(badge_level / 5)])
		.setFooter(xp + "/" + xp_threshold);
	await destinationChannel.send(embed);
}

async function sendEmbedStats(input_msg, destinationChannel = community_channel) {
	let { stats } = getMember(input_msg.author.id);
	const embed = new Discord.MessageEmbed()
		//.setTitle(`Stats`)
		.setAuthor(input_msg.member.displayName, input_msg.author.avatarURL())
		.setColor(COLOR_PINK);
	for ([stat_name, value] of stats.entries()) {
		embed.addField(stat_name, value, true);
	}
	await destinationChannel.send(embed);
}

async function sendEmbedInventory(input_msg, destinationChannel = community_channel) {
	let currencies_string = () => {
		let output = "";
		for ([key, value] of Object.entries(getMember(input_msg.author.id).currencies)) {
			output += `${key}: ${value}   `;
		}
		return output;
	};
	const embed = new Discord.MessageEmbed()
		.setTitle("Inventory")
		.setAuthor(input_msg.member.displayName, input_msg.author.avatarURL())
		.setColor(COLOR_PINK)
		//.setDescription()
		//.setThumbnail(LEVEL_BADGES[Math.trunc(level / 5)])
		.setFooter(currencies_string(), CURRENCY_ICON);
	await destinationChannel.send(embed);
}

function getProgressBar(level, xp, xp_threshold) {
	let progress = () => {
		let overall_progress = xp;
		let no_percent = xp_threshold - (XP_CURVE * level + XP_SHIFT);
		let full_percent = xp_threshold - no_percent;
		let chunkyfier = full_percent / PROGRESS_BAR_CHUNKS;
		return (overall_progress - no_percent) / chunkyfier;
	};

	let progress_bar = "";
	let i = 0;
	for (; i < progress(); i++) {
		progress_bar += PROGRESS_BAR_FULL;
	}
	for (; i < PROGRESS_BAR_CHUNKS; i++) {
		progress_bar += PROGRESS_BAR_EMPTY;
	}
	return progress_bar;
}

async function sendEmbedLeaderboard(destination_channel, leaderboard_size) {
	let community_members_SortedByXp = sortByXp(community_members);
	destination_channel = community_channel ?? destination_channel;

	let description = () => {
		let description = "```";
		leaderboard_size = leaderboard_size ?? DEFAULT_LEADERBOARD_SIZE;
		for (let i = 0; i < leaderboard_size; i++) {
			let member = community_members_SortedByXp[i];
			let name_padd = 20 - member.name.length;
			let level_padd = 5 - member.level.toString().length;
			description += member.name;
			for (let j = 0; j < name_padd; j++) {
				description += " ";
			}
			description += `Level: ${member.level}`;
			for (let j = 0; j < level_padd; j++) {
				description += " ";
			}
			description += `Xp: ${member.xp}\n`;
		}
		description += "```";
		return description;
	};

	embed = new Discord.MessageEmbed()
		.setTitle("Leaderboard")
		.setColor(COLOR_PINK)
		.setDescription(description())
		.setThumbnail(COMMUNITY_ICON)
		.setTimestamp();
	await destination_channel.send({ embed });
}

function sendEmbedShop() {
	let embed = new Discord.MessageEmbed().setTitle("Shop").setColor(COLOR_PINK).setFooter("Try !inspect #");
	shop_channel.send("** **\n**┍ - - - - Shop - - - - ┑**\n`!inspect` `!buy` `!sell`");
	for (item of Shop.items) {
		embed = new Discord.MessageEmbed().setTitle(`${item.name}`).setColor(COLOR_PINK);
		embed.addField(`${item.description}`, `₡${item.cost}`, true);
		shop_channel.send(embed);
	}
	shop_channel.send("`!inspect` `!buy` `!sell`\n**┕ - - - - Shop - - - - ┙**\n** **");
}

function loadCommunityMembersFromDisk() {
	// Load members from file as array
	let data = fs.readFileSync("community_members.json", "utf-8");
	let temp_array = JSON.parse(data);

	// Convert each 'object' in temp_array into 'CommunityMember', push that into community_members
	temp_array.forEach((member) => {
		// community_members.set(raw_member[0], new CommunityMember(raw_member[1], DEFAULT_XP_THRESHOLD));
		community_members.push(new CommunityMember(member, DEFAULT_XP_THRESHOLD));
	});
}

function createNewMembers() {
	// Create new Members out of new Users
	CLIENT.users.cache.forEach(({ id, username }) => {
		if (!getMember(id)) {
			console.log(`New user detected: ${username}`);
			community_members.push(new CommunityMember({ id: id, name: username }, DEFAULT_XP_THRESHOLD));
			console.log(`New user added: ${username}`);
		}
	});
}

function writeCommunityMembersToDisk() {
	// Converts community_members into JSON, then writes that to disk
	if (!write_to_disk) {
		couldntWriteToDisk(0);
		return;
	}
	if (!community_members) {
		couldntWriteToDisk(1);
		return;
	}
	if (!JSON.stringify(community_members, null, "\t")) {
		couldntWriteToDisk(2);
		return;
	}

	let json_pretty = JSON.stringify(community_members, null, "\t");
	fs.writeFile("community_members.json", json_pretty, (err) => {
		if (err) {
			throw err;
		}
	});
}
function couldntWriteToDisk(reason) {
	console.log("Couldn't write membersto disk. reason:" + reason);
}

function calculateXP(input) {
	let link_xp = input.substring(0, input.indexOf("http")).length + LINK_XP;
	return input.includes("http") ? link_xp : input.length * CHAR_XP;
}

function regenerate(member, status) {
	if (member.id != BOT_ID && status != "offline") {
		member.earnPassiveXp(xp_mult, XP_CURVE, XP_SHIFT);
		member.resetXpLimit();
	}
}

function gameTick() {
	CLIENT.users.cache.forEach(({ id, presence: { status } }) => {
		regenerate(getMember(id), status);
		updateRole(id);
	});
	handoutVoiceXp();
	writeCommunityMembersToDisk();
}

function updateInfo() {
	team_counting_channel.setName(`counting - ${team_count}﹢`);
}

function handoutVoiceXp() {
	let getVoiceXp = () => {
		if (on_voice.size < VOICE_XP_MIN_MEMBERS) {
			return false;
		} else if (on_voice.size <= VOICE_XP_MAX_MEMBERS) {
			return VOICE_XP_MULT * on_voice.size + VOICE_XP_BASE;
		} else {
			return VOICE_XP_PAST_MAX;
		}
	};
	let voice_xp = getVoiceXp();
	if (voice_xp) {
		for (let memberId of on_voice) {
			giveXp(memberId, xp_mult * voice_xp);
		}
	}
}

function sortByXp(input) {
	return Array.from(input).sort((member_a, member_b) => {
		return member_a.xp < member_b.xp ? 1 : -1;
	});
}

function getMember(id) {
	try {
		return community_members.filter((element) => element.id == id)[0];
	} catch (err) {
		return false;
	}
}

function setGuildAndChannels() {
	guild = CLIENT.guilds.cache.get(GUILD_ID);
	bot_channel = CLIENT.channels.cache.get(BOT_CHANNEL_ID);
	community_channel = CLIENT.channels.cache.get(COMMUNITY_CHANNEL_ID);
	team_counting_channel = CLIENT.channels.cache.get(TEAM_COUNTING_CHANNEL_ID);
	lottery_channel = CLIENT.channels.cache.get(LOTTERY_CHANNEL_ID);
	shop_channel = CLIENT.channels.cache.get(SHOP_CHANNEL_ID);
}

async function setCount() {
	let team_counting_channel = CLIENT.channels.cache.get(TEAM_COUNTING_CHANNEL_ID);
	let raw_messages = await team_counting_channel.messages.fetch({ limit: 2 });
	let messages = Array.from(raw_messages);

	let last_message;
	do {
		last_message = messages?.shift()[1];
	} while (last_message?.author.bot);
	if (update_teamcount_from_chat) {
		team_count = +last_message.content ?? team_count;
	}
	console.log(`Team Count set at ${team_count}`);
}

// async function retroactiveXp(date) {
// 	guild = CLIENT.guilds.cache.get(GUILD_ID);
// 	// get all relevant messages
// 	console.log("Starting RetroactiveXp");
// 	let all_messages = [];
// 	for (let [id, channel] of guild.channels.cache) {
// 		if (channel.type == "text" && channel.id != TEAM_COUNTING_CHANNEL_ID) {
// 			console.log(` ┕ Fetching msgs from channel ${channel.name}`);
// 			let last_id;
// 			outer: do {
// 				let options = { limit: 50 };
// 				if (last_id) {
// 					options.before = last_id;
// 				}
// 				let wrapped_msgs = await channel.messages.fetch(options);
// 				let clean_msgs = Array.from(wrapped_msgs);

// 				let current_message;
// 				for (let i = 0; i < clean_msgs.length - 1; i++) {
// 					current_message = clean_msgs[i][1];
// 					if (current_message.createdAt.getTime() < date) {
// 						break outer;
// 					} else {
// 						all_messages.push(current_message);
// 					}
// 				}

// 				last_id = current_message ? current_message.id : null;
// 			} while (last_id);
// 		}
// 	}
// 	// organize all relevant messages
// 	console.log("Organizing mesages");
// 	let organized_msgs = [];
// 	let id, xp, time;
// 	for (let message of all_messages) {
// 		id = message.author.id;
// 		xp = calculateXP(message.content);
// 		time = message.createdAt.getTime();
// 		let idMatch = organized_msgs.filter((element) => element.id == id)[0] ?? false;
// 		if (!idMatch) {
// 			organized_msgs.push({ id: id, messages: [{ xp: xp, time: time }] });
// 		} else {
// 			idMatch.messages.push({ xp: xp, time: time });
// 		}
// 	}
// 	// track xp of each user, keep it under the xp-limit/minute
// 	console.log("Tracking xp per message per user");
// 	let xp_limit_tracker = [];
// 	for (let entry of organized_msgs) {
// 		let current_member = {
// 			id: entry.id,
// 			xp: 0,
// 			xp_gain_limit: XP_GAIN_LIMIT,
// 			limit_reset: date + REPEATING_ACTIONS_COOLDOWN,
// 		};
// 		xp_limit_tracker.push(current_member);
// 		for (let message of entry.messages) {
// 			if (message.time >= current_member.limit_reset) {
// 				current_member.xp_gain_limit = XP_GAIN_LIMIT;
// 				current_member.limit_reset += REPEATING_ACTIONS_COOLDOWN;
// 			}
// 			let xp_gain = Math.min(message.xp, current_member.xp_gain_limit);
// 			current_member.xp += xp_gain;
// 			current_member.xp_gain_limit -= xp_gain;
// 		}
// 	}
// 	console.log("Handing out Xp");
// 	//give retroactive xp
// 	for (let { id, xp } of xp_limit_tracker) {
// 		giveXp(id, xp);
// 	}
// 	console.log("RetroacticeXp done");
// }

function giveXp(memberId, xp) {
	let member = getMember(memberId);
	let recipient_level = member.giveXp(xp, XP_CURVE, XP_SHIFT);
	updateRole(memberId);
}

function earnXp(memberId, xp) {
	let member = getMember(memberId);
	let recipient_level = member.earnXp(xp_mult, xp, XP_CURVE, XP_SHIFT);
	updateRole(memberId);
}

function recalculateLevels() {
	console.log("Recalculating levels");
	for (member of community_members) {
		member.recalculateLevel(XP_CURVE, XP_SHIFT);
	}
	console.log("Recalculating done");
}

function cleanString(input) {
	output = input;
	output = output.replace(/"/g, '"');
	output = output.replace(/\n/g, "");
	return output;
}

function moveMessage(fromChannel, toChannel, messageID) {
	fromChannel.messages
		.fetch(messageID)
		.then(async (message) => {
			var wbs = await toChannel.fetchWebhooks();
			if (wbs.size < 1) var wb = await toChannel.createWebhook("Move Message");
			else var wb = wbs.first();
			wb.send(message.content || "", {
				username: message.author.tag,
				avatarURL: message.author.avatarURL(),
				embeds: message.embeds,
				files: message.attachments.array(),
			}).then(() => {
				message.delete();
			});
		})
		.catch((e) => {
			console.log(e);
			throw "Error moving";
		});
}

function doSomethingOnce() {}

CLIENT.on("warn", (warn) => console.warn(warn));
CLIENT.on("error", (error) => console.error(error));

CLIENT.login(config.token);
