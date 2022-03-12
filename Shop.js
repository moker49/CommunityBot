const SLOT = {
	MAIN_HAND: 0,
	OFF_HAND: 1,
	NECK: 2,
	RING: 3,
};
module.exports = class Shop {
	static items = [
		{ cost: 5, name: "Dagger", description: "+10 Attack", slot: SLOT.MAIN_HAND, effects: { attack: 10 } },
		{
			cost: 100,
			name: "XP Talisman 1",
			description: "+10% XP Boost",
			slot: SLOT.NECK,
			effects: { xp_rate: 0.1 },
		},
	];
};
