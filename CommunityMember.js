module.exports = class CommunityMember {
	static DEFAULT_CURRENCIES = { gold: 0 };
	static DEFAULT_LEVEL = 1;
	static DEFAULT_XP = 0;
	static XP_GAIN_LIMIT = 200;
	static PASSIVE_XP_GAIN = 1;

	constructor(
		{ id, name, currencies, level, xp, xp_threshold, xp_gain_limit, inventory, equipment },
		default_xp_threshold
	) {
		this.id = id;
		this.name = name;

		this.currencies = currencies ?? CommunityMember.DEFAULT_CURRENCIES;
		this.level = level ?? CommunityMember.DEFAULT_LEVEL;

		this.xp = xp ?? CommunityMember.DEFAULT_XP;
		this.xp_threshold = xp_threshold ?? default_xp_threshold;
		this.xp_gain_limit = xp_gain_limit ?? CommunityMember.XP_GAIN_LIMIT;

		this.inventory = inventory ?? [];
		this.equipment = equipment ?? [];

		let attack = (level + 3) * 1.5;
		let hp = level * 50 + 50;
		let xp_rate = 1;

		for (item_id of this.equipment) {
			for ([stat_name, value] in Shop.items.get(item_id).effects) {
				eval(`${stat_name} += ${value}`);
			}
		}

		this.stats = new Map();
		this.stats.set("Attack", attack);
		this.stats.set("HP", hp);
		this.stats.set("XP Rate", xp_rate);
	}

	earnPassiveXp(xp_mult, XP_CURVE, XP_SHIFT) {
		this.giveXp(xp_mult * CommunityMember.PASSIVE_XP_GAIN, XP_CURVE, XP_SHIFT);
	}

	earnXp(xp_mult, xp, xp_curve, xp_shift) {
		for (let arg of arguments) {
			if (!arg) {
				throw `earnXp: bad parameter. xp_mult:${xp_mult}, xp:${xp}, curve:${xp_curve}, shift:${xp_shift}`;
			}
		}
		let possible_gain = xp;
		let current_limit = Math.max(0, this.xp_gain_limit);
		let actual_gain = xp_mult * Math.min(possible_gain, current_limit);
		this.xp_gain_limit -= actual_gain;
		return this.giveXp(xp_mult * actual_gain, xp_curve, xp_shift);
	}

	giveGold(gold) {
		this.currencies.gold += gold;
	}

	giveXp(xp, xp_curve, xp_shift) {
		for (let arg of arguments) {
			if (!arg) {
				throw `giveXp: bad parameter. xp:${xp}, curve:${xp_curve}, shift:${xp_shift}`;
			}
		}
		this.xp += xp;
		while (this.xp >= this.xp_threshold) {
			this.levelUp(xp_curve, xp_shift);
		}
		return this.level;
	}

	levelUp(xp_curve, xp_shift) {
		this.level += 1;
		this.xp_threshold += this.level * xp_curve + xp_shift;
	}

	recalculateLevel(xp_curve, xp_shift) {
		this.level = 1;
		this.xp_threshold = xp_curve + xp_shift;
		while (this.xp >= this.xp_threshold) {
			this.levelUp(xp_curve, xp_shift);
		}
	}

	resetXpLimit() {
		this.xp_gain_limit = CommunityMember.XP_GAIN_LIMIT;
	}
};
