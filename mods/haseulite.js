var modName = "mods/haseulite.js";
var loonaMod = "mods/funny elements 2022-11-15.js";
var fireMod = "mods/fire_mod.js";
var runAfterAutogenMod = "mods/runAfterAutogen and onload restructure.js";
var explodeAtPlusMod = "mods/explodeAtPlus.js";
var libraryMod = "mods/code_library.js";

if(enabledMods.includes(loonaMod) && enabledMods.includes(fireMod) && enabledMods.includes(runAfterAutogenMod) && enabledMods.includes(explodeAtPlusMod) && enabledMods.includes(libraryMod)) {
	//move explodeAt to YG Entertainment's dungeon

	oldExplodeAt = explodeAt;
	explodeAt = explodeAtPlus;
	haseuliteSpreadWhitelist = ["haseulite","haseulite_powder","molten_haseulite","haseulite_gas"];
	jinsouliteSpreadWhitelist = ["jinsoulite","jinsoulite_powder","molten_jinsoulite","jinsoulite_gas"];

	function coldExplosionAfterCooling(pixel,x,y,radius,fire,smoke,power,damage) {
		pixel.temp -= 2*damage*radius*power;
	};

	function reactionStealerImmutableElem2(pixel,newPixel,reactionTarget,ignoreSelf=true,_chanceMultMeantForJinsoulites=1) {
		if(!elements[reactionTarget]) {
			throw new Error(`No such element ${reactionTarget}!`);
		};
		if(typeof(newPixel) === "undefined") { //timing issue?
			return false;
		};
		var newElement = newPixel.element;
		if(ignoreSelf && newElement === pixel.element) {
			return false;
		};
		var newInfo = elements[newElement];
		if(typeof(newInfo.reactions) === "undefined") {
			return false;
		};
		if(typeof(newInfo.reactions[reactionTarget]) === "undefined") {
			return false;
		};
		var pixel2 = pixel;
		var pixel1 = newPixel;
		var r = JSON.parse(JSON.stringify(newInfo.reactions[reactionTarget]));
		
		if (r.setting && settings[r.setting]===0) {
			return false;
		}
		// r has the attribute "y" which is a range between two y values
		// r.y example: [10,30]
		// return false if y is defined and pixel1's y is not in the range
		if (r.tempMin !== undefined && pixel1.temp < r.tempMin) {
			return false;
		}
		if (r.tempMax !== undefined && pixel1.temp > r.tempMax) {
			return false;
		}
		if (r.charged && !pixel.charge) {
			return false;
		}
		if (r.chance !== undefined && Math.random() < (r.chance * _chanceMultMeantForJinsoulites)) {
			return false;
		}
		if (r.y !== undefined && (pixel1.y < r.y[0] || pixel1.y > r.y[1])) {
			return false;
		}
		if(r.elem1 !== undefined && r.elem2 !== undefined) {
			if(r.elem1 !== null && r.elem2 !== null) {
				r.elem1 = [r.elem1,r.elem2].flat();
			};
		};
		if (r.elem1 !== undefined) {
			// if r.elem1 is an array, set elem1 to a random element from the array, otherwise set it to r.elem1
			if (Array.isArray(r.elem1)) {
				var elem1 = r.elem1[Math.floor(Math.random() * r.elem1.length)];
			} else { var elem1 = r.elem1; }
			
			if (elem1 == null) {
				deletePixel(pixel1.x,pixel1.y);
			}
			else {
				changePixel(pixel1,elem1);
			}
		}
		if (r.charge1) { pixel1.charge = r.charge1; }
		if (r.temp1) { pixel1.temp += r.temp1; pixelTempCheck(pixel1); }
		if (r.color1) { // if it's a list, use a random color from the list, else use the color1 attribute
			pixel1.color = pixelColorPick(pixel1, Array.isArray(r.color1) ? r.color1[Math.floor(Math.random() * r.color1.length)] : r.color1);
		}
		if (r.attr1) { // add each attribute to pixel1
			for (var key in r.attr1) {
				pixel1[key] = r.attr1[key];
			}
		}
		if (r.charge2) { pixel2.charge = r.charge2; }
		if (r.temp2) { pixel2.temp += r.temp2; pixelTempCheck(pixel2); }
		if (r.color2) { // if it's a list, use a random color from the list, else use the color2 attribute
			pixel2.color = pixelColorPick(pixel2, Array.isArray(r.color2) ? r.color2[Math.floor(Math.random() * r.color2.length)] : r.color2);
		}
		if (r.attr2) { // add each attribute to pixel2
			for (var key in r.attr2) {
				pixel2[key] = r.attr2[key];
			}
		}
		if (r.func) { r.func(pixel1,pixel2); }
		return r.elem1!==undefined;
	};

	elements.loona = {
		color: ["#6f7d54","#4f5d34","#7c8a61"],
		behavior: behaviors.POWDER,
		tempHigh: 1031,
		category: "random rocks",
		state: "solid",
		density: 2466.73,
		hardness: 0.56,
		breakInto: ["rock","sulfur","loona_gravel","loona_gravel","loona_gravel","haseulite_powder", "rock","sulfur","loona_gravel","loona_gravel","loona_gravel","jinsoulite_powder", "rock","sulfur","loona_gravel","loona_gravel","loona_gravel","heejinite_powder"],
	};

	var backupCategoryWhitelist = ["land","powders","weapons","food","life","corruption","states","fey","Fantastic Creatures","dyes","energy liquids","random liquids","random gases","random rocks"];
	var backupElementWhitelist = ["mercury", "chalcopyrite_ore", "chalcopyrite_dust", "copper_concentrate", "fluxed_copper_concentrate", "unignited_pyrestone", "ignited_pyrestone", "everfire_dust", "extinguished_everfire_dust", "mistake", "polusium_oxide", "vaporized_polusium_oxide", "glowstone_dust", "redstone_dust", "soul_mud", "wet_soul_sand", "nitrogen_snow", "fusion_catalyst", "coal", "coal_coke", "blast_furnace_fuel", "molten_mythril"];

	function spoutCriteria(name) {
		if(typeof(elements[name]) !== "object") {
			throw new Error(`Nonexistent element ${name}`);
		};
		var info = elements[name];
		//console.log(`${name} (${JSON.stringify(elements[name])})`);
		if(typeof(info.state) === "undefined") {
			var state = null;
		} else {
			var state = info.state;
		};
		if(typeof(info.category) === "undefined") {
			var category = "other";
		} else {
			var category = info.category;
		};
		if(excludedSpoutElements.includes(name)) {
			return false
		};
		var include = false;
		if(["liquid","gas"].includes(state)) {
			include = true;
		};
		if(info.movable) {
			include = true;
		};
		if(backupCategoryWhitelist.includes(category)) {
			include = true;
		};
		if(backupElementWhitelist.includes(name)) {
			include = true;
		};
		if(category.includes("mudstone")) {
			include = true;
		};
		//console.log(include);
		return include;
	};
	
	function heejiniteHeatCriteria(name) {
		if(typeof(elements[name]) !== "object") {
			throw new Error(`Nonexistent element ${name}`);
		};
		var info = elements[name];
		//console.log(`${name} (${JSON.stringify(elements[name])})`);
		if(typeof(info.tempLow) === "undefined") {
			return false;
		};
		if(typeof(info.tempHigh) !== "undefined" && info.tempHigh < elements.heejinite.tempHigh) {
			return false;
		};
		return (info.tempLow < elements.heejinite.tempHigh) || ((typeof(info.state) !== "undefined") && (info.state === "gas"));
	};

	spoutCriteria = function(name) {
		if(typeof(elements[name]) !== "object") {
			throw new Error(`Nonexistent element ${name}`);
		};
		var info = elements[name];
		//console.log(`${name} (${JSON.stringify(elements[name])})`);
		if(typeof(info.state) === "undefined") {
			var state = null;
		} else {
			var state = info.state;
		};
		if(typeof(info.category) === "undefined") {
			var category = "other";
		} else {
			var category = info.category;
		};
		var include = false;
		if(["liquid","gas"].includes(state)) {
			include = true;
		};
		if(info.movable) {
			include = true;
		};
		if(backupCategoryWhitelist.includes(category)) {
			include = true;
		};
		if(backupElementWhitelist.includes(name)) {
			include = true;
		};
		if(category.includes("mudstone")) {
			include = true;
		};
		//console.log(include);
		return include;
	};

	//it doesn't want to acknowledge spoutCriteria, so...

	runAfterAutogen(function() {
		elements.loona.stateHigh = ["molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_haseulite","molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_jinsoulite","molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_heejinite"];
		hotHeejiniteElements = Object.keys(elements).filter(function(e) {
			return spoutCriteria(e) && heejiniteHeatCriteria(e) && !elements[e].excludeRandom && !e.startsWith("rad");
		});
	});

	elements.loona_gravel = {
		color: ["#b3be98","#919a6f","#68744b","#515931"],
		behavior: behaviors.POWDER,
		tempHigh: 1031,
		stateHigh: ["molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_haseulite","molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_jinsoulite","molten_loona","rock","rock","rock","sulfur_gas","sulfur_gas","molten_heejinite"],
		category: "random rocks",
		state: "solid",
		density: 1625.14,
		hardness: 0.97,
		breakInto: ["rock","sulfur","rock","haseulite_powder","rock","sulfur","rock","jinsoulite_powder","rock","sulfur","rock","heejinite_powder"],
	};

	haseuliteValueObject = {
		light: 1,
		radiation: 4,
		fire: [6, "smoke"],
		rad_fire: [10, "rad_smoke"],
		liquid_fire: [12, ["fire","liquid_smoke","smoke"]],
		plasma: [15, "fire"],
		liquid_rad_fire: [20, [null,"rad_fire","rad_fire","rad_smoke","rad_smoke"]],
		liquid_plasma: [30, ["plasma","liquid_fire","fire"]],
		liquid_irradium: [4, null]
	};

	jinsouliteValueObject = {
		cloud: 1,
		cloud_cloud: [1, "cloud"],
		snow_cloud: 2,
		hail_cloud: 2,
		rain_cloud: [3, "cloud"],
		water_cloud: [3, "cloud"],
		steam: 4,
		steam_cloud: [2, "steam"],
		rain_cloud_cloud: [1, "rain_cloud"],
		snow_cloud_cloud: [1, "snow_cloud"],
		hail_cloud_cloud: [1, "hail_cloud"],
		water_bomb: 59,
		water_bomb_2: 164.5,
		water_bomb_3: 322.5,
		water_bomb_4: 534,
		water_bomb_5: 798,
		water_bomb_6: 1112.5,
		water_bomb_7: 1480,
		water_bomb_8: 1901.5,
		water_bomb_9: 2373,
		water_bomb_10: 2898, //average rates from in-game simulation since I can't come up with an exponential function
		water_bomb_bomb: 59*59,
		water_bomb_bomb_2: 59*164.5,
		water_bomb_bomb_3: 59*322.5,
		water_bomb_bomb_4: 59*534,
		water_bomb_bomb_5: 59*798,
		water_bomb_bomb_6: 59*1112.5,
		water_bomb_bomb_7: 59*1480,
		water_bomb_bomb_8: 59*1901.5,
		water_bomb_bomb_9: 59*2373,
		water_bomb_bomb_10: 59*2898, //creates up to around 2,898 water bombs, each of which theoretically create up to around 59 water
		water_bomb_bomb: 59*59,
		water_bomb_2_bomb: 164.5*59,
		water_bomb_3_bomb: 322.5*59,
		water_bomb_4_bomb: 534*59,
		water_bomb_5_bomb: 798*59,
		water_bomb_6_bomb: 1112.5*59,
		water_bomb_7_bomb: 1480*59,
		water_bomb_8_bomb: 1901.5*59,
		water_bomb_9_bomb: 2373*59,
		water_bomb_10_bomb: 2898*59,  //creates up to around 59 water bombs, each of which theoretically create up to around 2,898 water
		water_bomb_10_bomb_10: 2898*2898,  //skipping to the funny
		water_bomb_cloud: 30,
	};

	/*function customStaining(pixel,customColorRgb,stainOverride=null) {
		if (settings["stainoff"]) { return }
		var stain = (stainOverride !== null ? stainOverride : elements[pixel.element].stain);
		if (stain > 0) {
			var newColor = customColorRgb.match(/\d+/g);
		}
		else {
			var newColor = null;
		}

		for (var i = 0; i < adjacentCoords.length; i++) {
			var x = pixel.x+adjacentCoords[i][0];
			var y = pixel.y+adjacentCoords[i][1];
			if (!isEmpty(x,y,true)) {
				var newPixel = pixelMap[x][y];
				if (elements[pixel.element].ignore && elements[pixel.element].ignore.indexOf(newPixel.element) !== -1) {
					continue;
				}
				if ((elements[newPixel.element].id !== elements[pixel.element].id || elements[newPixel.element].stainSelf) && (solidStates[elements[newPixel.element].state] || elements[newPixel.element].id === elements[pixel.element].id)) {
					if (Math.random() < Math.abs(stain)) {
						if (stain < 0) {
							if (newPixel.origColor) {
								newColor = newPixel.origColor;
							}
							else { continue; }
						}
						else if (!newPixel.origColor) {
							newPixel.origColor = newPixel.color.match(/\d+/g);
						}
						// if newPixel.color doesn't start with rgb, continue
						if (!newPixel.color.match(/^rgb/)) { continue; }
						// parse rgb color string of newPixel rgb(r,g,b)
						var rgb = newPixel.color.match(/\d+/g);
						if (elements[pixel.element].stainSelf && elements[newPixel.element].id === elements[pixel.element].id) {
							// if rgb and newColor are the same, continue
							if (rgb[0] === newColor[0] && rgb[1] === newColor[1] && rgb[2] === newColor[2]) { continue; }
							var avg = [];
							for (var j = 0; j < rgb.length; j++) {
								avg[j] = Math.round((rgb[j]*(1-Math.abs(stain))) + (newColor[j]*Math.abs(stain)));
							}
						}
						else {
							// get the average of rgb and newColor, more intense as stain reaches 1 
							var avg = [];
							for (var j = 0; j < rgb.length; j++) {
								avg[j] = Math.floor((rgb[j]*(1-Math.abs(stain))) + (newColor[j]*Math.abs(stain)));
							}
						}
						// set newPixel color to avg
						newPixel.color = "rgb("+avg.join(",")+")";
					}
				}
			}
		}
	}*/

	function valueSpreading(pixel,whitelist=null) {
		var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
		var rX = randomNeighborOffset[0];
		var rY = randomNeighborOffset[1];
		var rfX = pixel.x+rX;
		var rfY = pixel.y+rY;
		if(!isEmpty(rfX,rfY,true)) {
			var rOtherPixel = pixelMap[rfX][rfY];
			var rOtherElement = rOtherPixel.element;
			if(whitelist === null || (whitelist !== null && whitelist.includes(rOtherElement))) {
				if(typeof(rOtherPixel.value) !== "number") {
					rOtherPixel.value = 0;
				};
				if(typeof(rOtherPixel) === "undefined" || isEmpty(rfX,rfY,true)) {
					return false;
				};
				var averageValue = (pixel.value + rOtherPixel.value) / 2;
				pixel.value = averageValue;
				rOtherPixel.value = averageValue;
			};
		};
		return true;
	};

	function valueAbsorbency(pixel,valueObject) {
		for(i = 0; i < adjacentCoords.length; i++) {
			var oX = adjacentCoords[i][0];
			var oY = adjacentCoords[i][1];
			var fX = pixel.x+oX;
			var fY = pixel.y+oY;
			if(!isEmpty(fX,fY,true)) {
				var otherPixel = pixelMap[fX][fY];
				var otherElement = otherPixel.element;
				var otherInfo = elements[otherElement];
				if(valueObject[otherElement]) {
					//console.log(`${otherElement} in your area`)
					if(typeof(otherPixel) === "undefined" || isEmpty(fX,fY,true)) {
						console.log(`nope`)
						return false;
					};
					var ValueData = valueObject[otherElement];
					//console.log(ValueData.toString())
					if(ValueData instanceof Array) {
						var finalElement = ValueData[1];
						if(finalElement instanceof Array) {
							finalElement = finalElement[Math.floor(Math.random() * finalElement.length)];
						};
						if(finalElement !== null) {
							if(finalElement === -1) {
								deletePixel(otherPixel.x,otherPixel.y);
							} else {
								changePixel(otherPixel,finalElement);
							};
						};
						pixel.value += ValueData[0];
					} else if(typeof(ValueData) === "number") {
						deletePixel(otherPixel.x,otherPixel.y);
						pixel.value += ValueData;
					};
				};
			};
		};
		return true;
	};

	function valueFunction(pixel,valueObject,elementWhitelist=null) {
		if(typeof(pixel.value) === "undefined") {
			pixel.value = 0;
		};

		var oldValue = pixel.value;
		if(!valueAbsorbency(pixel,valueObject) || isNaN(pixel.value)) {
			pixel.value = oldValue;
		};

		var oldValue = pixel.value;
		if(!valueSpreading(pixel,elementWhitelist) || isNaN(pixel.value)) {
			pixel.value = oldValue;
		};
	}

	function haseulitoidTick(pixel) {
		if(pixel.value == undefined) { pixel.value = 0 };
		valueFunction(pixel,haseuliteValueObject,haseuliteSpreadWhitelist);
		if(pixel.oldColor === undefined) { pixel.oldColor = pixelColorPick(pixel) };
		if(pixel.oldColor === null) { pixel.oldColor = pixel.color };
		if(isNaN(pixel.value)) { pixel.value = 0 };
		pixel.color = lightenColor(pixel.oldColor,pixel.value / 3);
		
		if(pixel.value >= 350) {
			var coldBoomChance = Math.max(0.008 * ((pixel.value - 350) / 100), 0.001);
			if(Math.random() < coldBoomChance) {
				var coldBoomRadius = Math.min(30,Math.floor(7 + ((pixel.value - 350) / 100)));
				explodeAtPlus(pixel.x,pixel.y,coldBoomRadius,"cold_fire","cold_smoke",null,coldExplosionAfterCooling);
			};
		};
	}

	elements.haseulite = {
		color: ["#3cb00e", "#25d119", "#79f553"],
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		properties: {
			oldColor: null
		},
		behavior: behaviors.WALL,
		tick: function(pixel) { haseulitoidTick(pixel) },
		excludeVelocity: true, //wall shouldn't move
		tempHigh: 1757,
		onExplosionBreakOrSurvive: function(pixel,x,y,radius) {
			/*power is always radius/10
				r 5: value 7
				r 10: value 14
				r 15: value 28 
				r 20: value 56 
				r 25: value 112 
				r 30: value 224 
			*/
			pixel.value += (2**(((radius) / 5) - 1) * 7);
		},
		category: "solids",
		state: "solid",
		density: 7550,
		hardness: 0.93,
		breakInto: "haseulite_powder",
		conduct: 0.84,
	};

	if(!elements.steel.reactions) {
		elements.steel.reactions = {};
	};

	elements.steel.reactions.haseulite_powder = {
		elem1: "haseulite_vent",
		elem2: null,
		chance: 0.01,
		tempMin: 1200,
	};

	adjacentCoordsInverted = [[0,-1],[0,1],[-1,0],[1,0]];

	elements.haseulite_vent = {
		color: "#88b058",
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		behavior: behaviors.WALL,
		rotatable: true,
		desc: "This uses rotation, so just use debug to see the r value. r 0 means it vents haseulite below it upwards, r 1 means it vents haseulite above it downwards, r 2 means it vents left, and r 3 means it vents right.",
		tick: function(pixel) { 
			if(isNaN(pixel.r)) {
				pixel.r = 0;
			};
			pixel.r = pixel.r % 4;
			var coord = adjacentCoords[pixel.r];
			var invertCoord = adjacentCoordsInverted[pixel.r];	

			var fX = pixel.x+coord[0];
			var fY = pixel.y+coord[1];

			if(!isEmpty(fX,fY,true)) {
				var otherPixel = pixelMap[fX][fY];
				var otherElement = otherPixel.element;
				var otherInfo = elements[otherElement];
				if(typeof(otherPixel) === "undefined" || isEmpty(fX,fY,true)) {
					return false;
				};
				if(haseuliteSpreadWhitelist.includes(otherElement)) {
					var ventLimit = Math.min(10,Math.floor(1 + (Math.sqrt(Math.max(otherPixel.value,1)) / 2)));
					for(i = 1; i <= ventLimit; i++) {
						if(otherPixel.value >= 3) {
							var fIX = pixel.x+(invertCoord[0] * i);
							var fIY = pixel.y+(invertCoord[1] * i);
							if(isEmpty(fIX,fIY,false)) {
								createPixel("cold_fire",fIX,fIY);
								otherPixel.value -= 3;
							} else { //if the pixel to place isn't empty
								if(!outOfBounds(fIX,fIY)) { //if it isn't OoB
									if(pixelMap[fIX][fIY].element !== "cold_fire") { //if it isn't cold fire
										break;
									};
								} else { //if it is OoB
									break;
								};
							};
						} else {
							break;
						};
					};
				};
			};
			return true;
		},
		excludeVelocity: true, //wall shouldn't move
		tempHigh: elements.steel.tempHigh,
		stateHigh: ["molten_steel","haseulite_powder"],
		breakInto: ["metal_scrap","haseulite_powder"],
		category: "machines",
		state: "solid",
		density: 7550,
		hardness: 0.93,
		breakInto: "haseulite_powder",
		conduct: 0.84,
	}

	elements.haseulite_powder = {
		color: ["#5fb33e", "#32ba29", "#63d141"],
		properties: {
			oldColor: null
		},
		category: "powders",
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		tempHigh: 1757,
		behavior: behaviors.POWDER,
		tick: function(pixel) { haseulitoidTick(pixel) },
		onExplosionBreakOrSurvive: function(pixel,x,y,radius) {
			/*power is always radius/10
				r 5: value 7
				r 10: value 14
				r 15: value 28 
				r 20: value 56 
				r 25: value 112 
				r 30: value 224 
			*/
			pixel.value += (2**(((radius) / 5) - 1) * 7);
		},
		stateHigh: "molten_haseulite",
		category: "powders",
		state: "solid",
		hidden: true,
		density: 4512,
		hardness: 0.7,
		conduct: 0.43,
	};

	elements.molten_haseulite = {
		color: ["#cbf569","#f1ffd6","#fdffb5", "#fffa99"],
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		properties: {
			oldColor: null
		},
		behavior: [
			"XX|CR:fire%3|XX", //PTT
			"M2|XX|M2",
			"M1|M1|M1",
		],
		tick: function(pixel) { haseulitoidTick(pixel) },
		onExplosionBreakOrSurvive: function(pixel,x,y,radius) {
			/*power is always radius/10
				r 5: value 7
				r 10: value 14
				r 15: value 28 
				r 20: value 56 
				r 25: value 112 
				r 30: value 224 
			*/
			pixel.value += (2**(((radius) / 5) - 1) * 7);
		},
		density: 7214,
		hardness: 0.52,
		breakInto: "haseulite_gas",
		temp: 1957,
		tempHigh: 3100,
		conduct: 0.23,
	};

	elements.haseulite_gas = {
		color: ["#ffff9d", "#ffffff", "#e9ffe6", "#ffffe5"],
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		properties: {
			oldColor: null
		},
		tick: function(pixel) { haseulitoidTick(pixel) },
		onExplosionBreakOrSurvive: function(pixel,x,y,radius) {
			/*power is always radius/10
				r 5: value 7
				r 10: value 14
				r 15: value 28 
				r 20: value 56 
				r 25: value 112 
				r 30: value 224 
			*/
			pixel.value += (2**(((radius) / 5) - 1) * 7);
		},
		density: 0.289,
		temp: 3700,
		hardness: 1,
		conduct: 0.13,
	};

	/*
	var shimmeringColor = convertHslObjects(hslColorStringToObject(`hsl(${(pixelTicks / 2) % 360},100%,50%)`,"rgb"));
	customStaining(pixel,shimmeringColor,0.2);
	*/

	function heejinitoidTick(pixel) {
		if(pixel.oldColor === null) { pixel.oldColor = pixel.color };
		if(pixel.oldColor === undefined) { pixel.oldColor = pixelColorPick(pixel) };
		var color = rgbStringToHSL(convertColorFormats(pixel.oldColor,"rgb"),"json");
		var heejiniteHueSpread = 30 + (pixel.temp/9.25)
		var hueOffset = (Math.sin(pixelTicks / 11) * heejiniteHueSpread) + 15; color.h += hueOffset;
		var color = convertHslObjects(color,"rgb");
		pixel.color = color;
	};

	function hotHeejinitoidTick(pixel) {
		if(pixel.oldColor === undefined) { pixel.oldColor = pixelColorPick(pixel) };
		if(Math.random() < (pixel.temp >= 1500 ? 0.02 : 0.01)) {
			if(pixel.temp >= 1387.5) {
				var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
				var rX = randomNeighborOffset[0];
				var rY = randomNeighborOffset[1];
				var rfX = pixel.x+rX;
				var rfY = pixel.y+rY;
				if(isEmpty(rfX,rfY,false)) {
					var randomEligibleHotElement = hotHeejiniteElements[Math.floor(Math.random() * hotHeejiniteElements.length)];
					createPixel(randomEligibleHotElement,rfX,rfY);
					pixelMap[rfX][rfY].temp = pixel.temp;
				};
			};
		};
	}

	elements.heejinite = {
		color: ["#cf1172", "#fa1977", "#ff619e"],
		fireColor: ["#a9085e", "#a32e61", "#fca7c6"],
		properties: {
			oldColor: null
		},
		behavior: behaviors.WALL,
		tick: function(pixel) { heejinitoidTick(pixel) },
		excludeVelocity: true, //wall shouldn't move
		tempHigh: 837,
		category: "solids",
		state: "solid",
		density: 3773,
		stain: 0.1,
		hardness: 0.79,
		breakInto: "heejinite_powder",
		conduct: 0.86,
	};

	elements.heejinite_powder = {
		color: ["#d64790", "#e63e84", "#f054ac"],
		fireColor: ["#a9085e", "#a32e61", "#fca7c6"],
		properties: {
			oldColor: null
		},
		behavior: behaviors.POWDER,
		tick: function(pixel) { heejinitoidTick(pixel) },
		excludeVelocity: true, //wall shouldn't move
		tempHigh: 837,
		hidden: true,
		stateHigh: "molten_heejinite",
		category: "powders",
		state: "solid",
		density: 1412,
		stain: 0.1,
		hardness: 0.66,
		breakInto: "heejinite_powder",
		conduct: 0.42,
	};

	elements.molten_heejinite = {
		color: ["#ff0f77","#ff59c2","#ff405c", "#fa5a48"],
		fireColor: ["#a9085e", "#a32e61", "#fca7c6"],
		properties: {
			oldColor: null
		},
		tick: function(pixel) {
			heejinitoidTick(pixel);
			hotHeejinitoidTick(pixel);
		},
		density: 3121,
		hardness: 0.5,
		breakInto: "heejinite_gas",
		temp: 1000,
		tempHigh: 1501,
		conduct: 0.22,
	};

	elements.heejinite_gas = {
		color: ["#fffab8", "#ffdab3", "#ffd1d1", "#ffc4df", "#ffb0eb"],
		fireColor: ["#a9085e", "#a32e61", "#fca7c6"],
		properties: {
			oldColor: null
		},
		tick: function(pixel) {
			heejinitoidTick(pixel);
			hotHeejinitoidTick(pixel);
		},
		density: 0.117,
		temp: 1800,
		hardness: 1,
		conduct: 0.12,
	};

	jinsouliteReducedSwapWhitelist = ["slime","glue","soda","milk","chocolate_milk","fruit_milk","ink","blood","vaccine","antibody","infection","sap","ketchup","spirit_tear","enchanted_ketchup","lean","poisoned_ketchup","dirty_ketchup","zombie_blood"];

	function jinsouliteDissolution(pixel) {
		var did = false;
		for(i = 0; i < 2; i++) {
			var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
			var rfX = pixel.x+randomNeighborOffset[0];
			var rfY = pixel.y+randomNeighborOffset[1];
			if(!isEmpty(rfX,rfY,true)) {
				var rOtherPixel = pixelMap[rfX][rfY];
				if(!rOtherPixel) { return false };
				var rOtherElement = rOtherPixel.element;
				if(rOtherElement.endsWith("water") || (Math.random() < 0.3 && jinsouliteReducedSwapWhitelist.includes(rOtherElement))) {
					swapPixels(pixel,rOtherPixel);
					did = true;
				};
			};
		};
		return did;
	};

	function jinsouliteMovement(pixel,move1Spots,move2Spots) {		
		if(move1Spots.length > 0) {
			var randomMove1 = move1Spots[Math.floor(Math.random() * move1Spots.length)];
			if(!tryMove(pixel, pixel.x+randomMove1[0], pixel.y+randomMove1[1])) {
				//console.log((pixel.x+randomMove1[0]) + " " + (pixel.y+randomMove1[1]))
				var newPixel = null;
				if(!outOfBounds(pixel.x+randomMove1[0],pixel.y+randomMove1[1])) {
					newPixel = pixelMap[pixel.x+randomMove1[0]][pixel.y+randomMove1[1]]; //newPixel is AAA
				};
				if(outOfBounds(pixel.x+randomMove1[0],pixel.y+randomMove1[1]) || !reactionStealerImmutableElem2(pixel,newPixel,"water",true,2)) {
					if(move2Spots.length > 0) {
						var randomMove2 = move2Spots[Math.floor(Math.random() * move2Spots.length)];
						if(!tryMove(pixel, pixel.x+randomMove2[0], pixel.y+randomMove2[1])) {
							var newPixel = null;
							if(!outOfBounds(pixel.x+randomMove1[0],pixel.y+randomMove1[1])) {
								newPixel = pixelMap[pixel.x+randomMove1[0]][pixel.y+randomMove1[1]]; //newPixel is AAA
							};
							if(newPixel !== null) { reactionStealerImmutableElem2(pixel,newPixel,"water",true,2) };
						};
					};
				};
			};
		};
		doDefaults(pixel);
	};

	function jinsouliteSolidNonWaterSideReactions(pixel) {
		var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
		var rfX = pixel.x+randomNeighborOffset[0];
		var rfY = pixel.y+randomNeighborOffset[1];
		if(!isEmpty(rfX,rfY,true)) {
			var rOtherPixel = pixelMap[rfX][rfY];
			if(typeof(rOtherPixel) === "undefined" || isEmpty(rfX,rfY,true)) {
				return false;
			};
			reactionStealerImmutableElem2(pixel,rOtherPixel,"water",true,2);
		};
		return true;
	};
	
	function jinsouliteSolidWaterSideReactions(pixel) {
		var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
		var rfX = pixel.x+randomNeighborOffset[0];
		var rfY = pixel.y+randomNeighborOffset[1];
		if(!isEmpty(rfX,rfY,true)) {
			var pixel2 = pixelMap[rfX][rfY];
			var pixel1 = pixel;
			if(typeof(pixel2) === "undefined" || isEmpty(rfX,rfY,true)) {
				return false;
			};
			if(typeof(pixel1) === "undefined" || isEmpty(pixel.x,pixel.y,true)) {
				return false;
			};
			var rOtherElement = pixel2.element;
			var waterReactions = elements.water.reactions;
			
			if(rOtherElement === pixel.element) {
				return false;
			};
			if(waterReactions[rOtherElement]) {
				var r = waterReactions[rOtherElement];

				if (r.setting && settings[r.setting]===0) {
					return false;
				}
				// r has the attribute "y" which is a range between two y values
				// r.y example: [10,30]
				// return false if y is defined and pixel1's y is not in the range
				if (r.tempMin !== undefined && pixel1.temp < r.tempMin) {
					return false;
				}
				if (r.tempMax !== undefined && pixel1.temp > r.tempMax) {
					return false;
				}
				if (r.charged && !pixel.charge) {
					return false;
				}
				if (r.chance !== undefined && Math.random() < (r.chance * 2)) {
					return false;
				}
				if (r.y !== undefined && (pixel1.y < r.y[0] || pixel1.y > r.y[1])) {
					return false;
				}
				if (r.charge1) { pixel1.charge = r.charge1; }
				if (r.temp1) { pixel1.temp += r.temp1; pixelTempCheck(pixel1); }
				if (r.color1) { // if it's a list, use a random color from the list, else use the color1 attribute
					pixel1.color = pixelColorPick(pixel1, Array.isArray(r.color1) ? r.color1[Math.floor(Math.random() * r.color1.length)] : r.color1);
				}
				if (r.attr1) { // add each attribute to pixel1
					for (var key in r.attr1) {
						pixel1[key] = r.attr1[key];
					}
				}
				var elem1 = r.elem1
				if (elem1 !== undefined && elem1 instanceof Array) {
					elem1 = elem1[Math.floor(Math.random() * elem1.length)];
				};
				
				if (r.elem2 !== undefined) {
					// if r.elem2 is an array, set elem2 to a random element from the array, otherwise set it to r.elem2
					if (Array.isArray(r.elem2)) {
						var elem2 = r.elem2[Math.floor(Math.random() * r.elem2.length)];
					} else { var elem2 = r.elem2; }

					if (elem2 == null) {
						if(elem1 !== undefined) { changePixel(pixel2,elem1) };
					}
					else {
						changePixel(pixel2,elem2);
					}
				}
				if (r.charge2) { pixel2.charge = r.charge2; }
				if (r.temp2) { pixel2.temp += r.temp2; pixelTempCheck(pixel2); }
				if (r.color2) { // if it's a list, use a random color from the list, else use the color2 attribute
					pixel2.color = pixelColorPick(pixel2, Array.isArray(r.color2) ? r.color2[Math.floor(Math.random() * r.color2.length)] : r.color2);
				}
				if (r.attr2) { // add each attribute to pixel2
					for (var key in r.attr2) {
						pixel2[key] = r.attr2[key];
					}
				}
				if (r.func) { r.func(pixel1,pixel2); }
				return r.elem1!==undefined || r.elem2!==undefined;
			};
		};
		return true;
	};

	function jinsouliteValue(pixel) {
		valueFunction(pixel,jinsouliteValueObject,jinsouliteSpreadWhitelist);
		if(pixel.oldColor === null) { pixel.oldColor = pixel.color };
		if(isNaN(pixel.value)) { pixel.value = 0 };
		pixel.color = changeSaturation(pixel.oldColor,pixel.value / 3,"subtract","rgb")
		
		if(pixel.value > 1) {
			if(Math.random() < Math.min((pixel.value / 200),0.5)) {
				var randomNeighborOffset = adjacentCoords[Math.floor(Math.random() * adjacentCoords.length)];
				var rX = randomNeighborOffset[0];
				var rY = randomNeighborOffset[1];
				var rfX = pixel.x+rX;
				var rfY = pixel.y+rY;
				if(isEmpty(rfX,rfY,false)) {
					createPixel("water",rfX,rfY);
					pixel.value--;
				};
			};
			/*for(g = 0; g < adjacentCoords.length; g++) {
				var oX = adjacentCoords[g][0];
				var oY = adjacentCoords[g][1];
				var fX = pixel.x+oX;
				var fY = pixel.y+oY;
				if(isEmpty(fX,fY,false)) {
					createPixel("water",fX,fY);
					pixel.value--;
				};
			};*/
		};
	}

	function jinsoulitoidTick(pixel,move1Spots=[],move2Spots=[]) {
		if(pixel.oldColor === undefined) { pixel.oldColor = pixelColorPick(pixel) };
		if(pixel.value == undefined) { pixel.value = 0 };
		if(jinsouliteDissolution(pixel)) {
			return;
		};
		jinsouliteValue(pixel);
		jinsouliteMovement(pixel,move1Spots,move2Spots);
	};

	elements.jinsoulite = {
		color: ["#0e51b0", "#2129ff", "#3b3dbf"],
		fireColor: ["#121978", "#6a9fe6", "#5963d9"],
		behavior: [
			"XX|CR:water%0.05|XX",
			"CR:water%0.05|XX|CR:water%0.05",
			"XX|CR:water%0.05|XX"
		],
		behaviorOn: [
			"XX|CR:water%0.15|XX",
			"CR:water%0.15|XX|CR:water%0.15",
			"XX|CR:water%0.15|XX"
		],
		properties: {
			oldColor: null
		},
		tick: function(pixel) { 
			if(pixel.value == undefined) { pixel.value = 0 };
			if(pixel.oldColor === undefined) { pixel.oldColor = pixelColorPick(pixel) };
			jinsouliteValue(pixel);
			jinsouliteSolidNonWaterSideReactions(pixel);
			jinsouliteSolidWaterSideReactions(pixel);
		},
		tempHigh: 2606,
		category: "solids",
		state: "solid",
		density: 8331,
		hardness: 0.82,
		breakInto: "jinsoulite_powder",
		conduct: 0.93,
	};

	elements.jinsoulite_powder = {
		color: ["#4580ba", "#355eb0", "#2d6fc4"],
		fireColor: ["#121978", "#6a9fe6", "#5963d9"],
		tempHigh: 2606,
		behavior: [
			"XX|CR:water%0.05|XX",
			"CR:water%0.05|XX|CR:water%0.05",
			"XX|CR:water%0.05|XX"
		],
		properties: {
			oldColor: null
		},
		category: "powders",
		behaviorOn: [
			"XX|CR:water%0.15|XX",
			"CR:water%0.15|XX|CR:water%0.15",
			"XX|CR:water%0.15|XX"
		],
		tick: function(pixel) { jinsoulitoidTick(pixel,[[0,1]],[[-1,1],[1,1]]) },
		stateHigh: "molten_jinsoulite",
		category: "powders",
		state: "solid",
		hidden: true,
		density: 5801,
		hardness: 0.7,
		conduct: 0.43,
	};

	elements.molten_jinsoulite = {
		behavior: [
			"XX|CR:fire,fire,steam%0.5|XX",
			"XX|XX|XX",
			"XX|XX|XX"
		],
		behaviorOn: [
			"XX|CR:fire,steam,steam%0.7|XX",
			"CR:steam%0.1|XX|CR:steam%0.1",
			"XX|CR:steam%0.1|XX"
		],
		properties: {
			oldColor: null
		},
		color: ["#4e35db","#7767eb","#a876f5", "#78acff"],
		fireColor: ["#121978", "#6a9fe6", "#5963d9"],
		fireElement: ["fire","fire","steam"],
		tick: function(pixel) { jinsoulitoidTick(pixel,[[-1,1],[0,1],[1,1]],[[-1,0],[1,0]]); },
		density: 6448,
		hardness: 0.61,
		breakInto: "jinsoulite_gas",
		temp: 3000,
		tempHigh: 5532.8509,
		conduct: 0.34,
	};

	elements.jinsoulite_gas = {
		color: ["#c0f0ef", "#c2c1db", "#c0bff5", "#cdcce6"],
		behavior: [
			"XX|CR:steam%0.5|XX",
			"CR:steam%0.5|XX|CR:steam%0.5",
			"XX|CR:steam%0.5|XX",
		],
		behaviorOn: [
			"XX|CR:steam%1|XX",
			"CR:steam%1|XX|CR:steam%1",
			"XX|CR:steam%1|XX",
		],
		fireColor: ["#08a953", "#2ea332", "#d1e0d3"],
		properties: {
			oldColor: null
		},
		tick: function(pixel) { jinsoulitoidTick(pixel,adjacentCoords,[[-1,-1],[1,-1],[1,1],[-1,1]]) },
		density: 0.5833,
		temp: 6000,
		hardness: 1,
		conduct: 0.19,
	};

	r_mad_X_m_s_d = urlParams.get('r_mad_X_m_s_d');
	noaegs_dud_X_ss_d_n_s = (urlParams.get('noaegs_dud_X_ss_d_n_s') !== null);

	dl_ekf_dml_th_su_ae_yu_eo_d_ch_s = {
		"01-02": {eu_deu_yu_d_g: "Jihyo", chae_i_ae_g: "rgb(250,200,87)", h_gae_yeo_e: "Twice"},
		"03-02": {eu_deu_yu_d_g: "Rei and Gong Yubin", chae_i_ae_g: "linear-gradient(90deg, rgba(105,195,45,1) 0%, rgba(105,195,45,1) 20%, rgba(255,227,226,1) 80%, rgba(255,227,226,1) 100%)", h_gae_yeo_e: "IVE and tripleS", h_g_m_Xya_dus: true},
		"09-02": {eu_deu_yu_d_g: "Kim Yooyeon", chae_i_ae_g: "rgb(205,102,171)", h_gae_yeo_e: "tripleS"},
		"21-02": {eu_deu_yu_d_g: "Leeseo", chae_i_ae_g: "rgb(255,240,1)", h_gae_yeo_e: "IVE"},
		"10-02": {eu_deu_yu_d_g: "Kim Lip", chae_i_ae_g: "rgb(234,2,1)", h_gae_yeo_e: "Loona"},
		"24-03": {eu_deu_yu_d_g: "Mina", chae_i_ae_g: "rgb(111,197,194)", h_gae_yeo_e: "Twice"},
		"12-04": {eu_deu_yu_d_g: "Jeong Hyerin", chae_i_ae_g: "rgb(142,108,255)", h_gae_yeo_e: "tripleS"},
		"23-04": {eu_deu_yu_d_g: "Chaeyoung", chae_i_ae_g: "rgb(255,23,68)", h_gae_yeo_e: "Twice"},
		"24-05": {eu_deu_yu_d_g: "Yves", chae_i_ae_g: "rgb(125,0,30)", h_gae_yeo_e: "Loona"},
		"28-05": {eu_deu_yu_d_g: "Dahyun", chae_i_ae_g: "rgb(255,255,255)", h_gae_yeo_e: "Twice"},
		"04-06": {eu_deu_yu_d_g: "Choerry", chae_i_ae_g: "rgb(92,44,146)", h_gae_yeo_e: "Loona"},
		"13-06": {eu_deu_yu_d_g: "JinSoul", chae_i_ae_g: "rgb(20,36,176)", h_gae_yeo_e: "Loona"},
		"14-06": {eu_deu_yu_d_g: "Tzuyu", chae_i_ae_g: "rgb(2,119,189)", h_gae_yeo_e: "Twice"},
		"06-08": {eu_deu_yu_d_g: "Yoon Seoyeon", chae_i_ae_g: "rgb(34,174,255)", h_gae_yeo_e: "tripleS"},
		"18-08": {eu_deu_yu_d_g: "HaSeul", chae_i_ae_g: "rgb(0,166,81)", h_gae_yeo_e: "Loona"},
		"31-08": {eu_deu_yu_d_g: "Wonyoung", chae_i_ae_g: "rgb(255,0,30)", h_gae_yeo_e: "IVE"}, //stay mad
		"01-09": {eu_deu_yu_d_g: "Yujin", chae_i_ae_g: "rgb(255,57,154)", h_gae_yeo_e: "IVE"},
		"22-09": {eu_deu_yu_d_g: "Nayeon", chae_i_ae_g: "rgb(129,212,250)", h_gae_yeo_e: "Twice"},
		"24-09": {eu_deu_yu_d_g: "Gaeul", chae_i_ae_g: "rgb(0,85,168)", h_gae_yeo_e: "IVE"},
		"03-10": {eu_deu_yu_d_g: "Kim Soomin", chae_i_ae_g: "rgb(236,138,165)", h_gae_yeo_e: "tripleS"},
		"13-10": {eu_deu_yu_d_g: "Kim Nakyoung", chae_i_ae_g: "rgb(101,153,164)", h_gae_yeo_e: "tripleS"},
		"19-10": {eu_deu_yu_d_g: "HeeJin", chae_i_ae_g: "rgb(255,0,146)", h_gae_yeo_e: "Loona"},
		"20-10": {eu_deu_yu_d_g: "Chuu", chae_i_ae_g: "rgb(246,144,126)", h_gae_yeo_e: "Loona"},
		"24-10": {eu_deu_yu_d_g: "Lee Jiwoo", chae_i_ae_g: "rgb(255,249,36)", h_gae_yeo_e: "tripleS"},
		"01-11": {eu_deu_yu_d_g: "Jeongyeon", chae_i_ae_g: "rgb(188,215,118)", h_gae_yeo_e: "Twice"},
		"09-11": {eu_deu_yu_d_g: "Momo", chae_i_ae_g: "rgb(248,207,215)", h_gae_yeo_e: "Twice"},
		"11-11": {eu_deu_yu_d_g: "YeoJin", chae_i_ae_g: "rgb(244,111,31)", h_gae_yeo_e: "Loona"},
		"13-11": {eu_deu_yu_d_g: "Olivia Hye", chae_i_ae_g: "rgb(143,143,143)", h_gae_yeo_e: "Loona"},
		"15-11": {eu_deu_yu_d_g: "HyunJin", chae_i_ae_g: "rgb(255,204,0)", h_gae_yeo_e: "Loona"},
		"19-11": {eu_deu_yu_d_g: "Go Won", chae_i_ae_g: "rgb(48,195,156)", h_gae_yeo_e: "Loona"},
		"21-11": {eu_deu_yu_d_g: "Liz", chae_i_ae_g: "rgb(0,195,245)", h_gae_yeo_e: "IVE"},
		"04-12": {eu_deu_yu_d_g: "Kim Chaeyeon", chae_i_ae_g: "rgb(141,191,65)", h_gae_yeo_e: "tripleS"},
		"09-12": {eu_deu_yu_d_g: "ViVi", chae_i_ae_g: "rgb(255,152,180)", h_gae_yeo_e: "Loona"},
		"20-12": {eu_deu_yu_d_g: "Kaede", chae_i_ae_g: "rgb(255,201,53)", h_gae_yeo_e: "tripleS"},
		"29-12": {eu_deu_yu_d_g: "Sana", chae_i_ae_g: "rgb(159,168,218)", h_gae_yeo_e: "Twice"}
	};

	//just to confuse the hell out of anyone reading this (they will still quickly figure it out)
	var r_dyu_gyeom_gyo_10_ae_p_d_g_gyang_d = false;

	function h_d_s_X_myo_eu_ae_u_so() {
		var d = r_dyu_gyeom_gyo_10_ae_p_d_g_gyang_d ? new Date(1549800000000) : new Date();
		var eu_ae_u_so = (d.getMonth()+1).toString();
		if(eu_ae_u_so.length == 1) { eu_ae_u_so = "0" + eu_ae_u_so };
		var X_myo = d.getDate().toString();
		if(X_myo.length == 1) { X_myo = "0" + X_myo };
		var X_myo_eu_ae_u_so = X_myo + "-" + eu_ae_u_so;
		return (r_mad_X_m_s_d === null ? X_myo_eu_ae_u_so : r_mad_X_m_s_d);
	}

	function g_d_hyan_s_d_g_ddi_deu_chi_ya_cha(u_meud) {
		var r_mad_X_m_s_deud_n_n_m_h_d = "";
		if(r_mad_X_m_s_d !== null) {
			r_mad_X_m_s_deud_n_n_m_h_d += "(Fake date) ";
		};
		var noaegs_dud_X_ss_d_n_seud_n_n_m_h_d = "";
		if(noaegs_dud_X_ss_d_n_s) {
			noaegs_dud_X_ss_d_n_seud_n_n_m_h_d += "(Shortened to 2) ";
		};
		if($_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__[u_meud] === false) {
			$_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__[u_meud] = true;
		};
		if(d_p_mi_yeo_m_s_d__sod__$_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__()) {
			var X_myo_eu_ae_u_so = h_d_s_X_myo_eu_ae_u_so();
			var eu_deu_yu_d_geud_n_n_m_h_d = dl_ekf_dml_th_su_ae_yu_eo_d_ch_s[X_myo_eu_ae_u_so];
			if(eu_deu_yu_d_geud_n_n_m_h_d == undefined) { eu_deu_yu_d_geud_n_n_m_h_d = "[No such member?]" };
			if(typeof(eu_deu_yu_d_geud_n_n_m_h_d) === "object") {
				eu_deu_yu_d_geud_n_n_m_h_d = eu_deu_yu_d_geud_n_n_m_h_d.eu_deu_yu_d_g;
			};
alert(`You have clicked on all ${Object.keys($_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__).length} birthday messages spread throughout some of the elements.
Member: ${r_mad_X_m_s_deud_n_n_m_h_d}${noaegs_dud_X_ss_d_n_seud_n_n_m_h_d}${eu_deu_yu_d_geud_n_n_m_h_d}. Stan ${dl_ekf_dml_th_su_ae_yu_eo_d_ch_s[h_d_s_X_myo_eu_ae_u_so()].h_gae_yeo_e}!`);
		};
	};

	function d_p_mi_yeo_m_s_d__sod__$_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__() {
		var Xae_u_d = true;
		for(di_deu_dus in $_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__) {
			Xae_u_d = Xae_u_d && $_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__[di_deu_dus];
		};
		return Xae_u_d;
	};

	function highlightButton(element,color,blurRadius="15px",spreadRadius="5px") {
		var button = document.getElementById(`elementButton-${element}`);
		if(button == null) {
			throw new Error(`Nonexistent button for ${element}`)
		};
		if(typeof(blurRadius) == "number") { blurRadius = blurRadius + "px" };
		if(typeof(spreadRadius) == "number") { spreadRadius = spreadRadius + "px" };
		document.getElementById(`elementButton-${element}`).style["-webkit-box-shadow"] = `0px 0px ${blurRadius} ${spreadRadius} ${color}`;
		document.getElementById(`elementButton-${element}`).style["box-shadow"] = `0px 0px ${blurRadius} ${spreadRadius} ${color}`;
	};

	runAfterAutogen(function() {
		
		cho_mu_hya_u_h_X_d_n_chyu_i_m_cha_i_ya_n_s = ["distance_display","find_toggle","prop","number_adjuster","replace","alt_replace","alt_alt_replace","change","alt_change","alt_alt_change"]; //츄 lmao

		yu_i_m_cha_i_ya_n_s = ["toxin","poison","blood","cancer","rotten_meat","frozen_rotten_meat","zombie_blood","plague","stench","infection","acid","acid_gas","rot","shit","shit_gravel","poo","dioxin","lean"];

		X_myo_eu_ae_u_so = h_d_s_X_myo_eu_ae_u_so();
		
		var baseArray = ["heejinite","heejinite_powder","molten_heejinite","heejinite_gas","haseulite","haseulite_powder","molten_haseulite","haseulite_gas","jinsoulite","jinsoulite_powder","molten_jinsoulite","jinsoulite_gas","haseulite_vent","loona","loona_gravel","molten_loona"];


		if(dl_ekf_dml_th_su_ae_yu_eo_d_ch_s[X_myo_eu_ae_u_so]) {
			g_mu_Xae_eu_ddi_deu_dus_n = Object.keys(elements).filter(function(e) {
				var cat = elements[e].category;
				if(cat == undefined) { cat = "other" };
				cat = cat.toLowerCase();
				return (
					cat !== "clouds" &&
					cat !== "auto creepers" &&
					cat !== "auto_bombs" &&
					cat !== "auto_fey" &&
					cat !== "spouts" &&
					cat !== "singularities" &&
					cat !== "random" &&
					cat !== "weapons" &&
					cat !== "idk" &&
					cat !== "corruption" &&
					cat !== "radioactive" &&
					cat !== "piss" &&
					cat !== "shit" &&
					cat !== "vomit" &&
					cat !== "cum" &&
					!e.includes("head") &&
					(!e.includes("body") || e.includes("antibody")) &&
					!cat.includes("random") &&
					!cat.includes("udstone") &&
					!elements[e].nocheer &&
					!cho_mu_hya_u_h_X_d_n_chyu_i_m_cha_i_ya_n_s.includes(e) &&
					!yu_i_m_cha_i_ya_n_s.includes(e) &&
					!elements[e].hidden && 
					!baseArray.includes(e)
				);
			}); shuffleArray(g_mu_Xae_eu_ddi_deu_dus_n); g_mu_Xae_eu_ddi_deu_dus_n = g_mu_Xae_eu_ddi_deu_dus_n.slice(0,noaegs_dud_X_ss_d_n_s ? 2 : 12);

			$_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__ = {};
			for(eo = 0; eo < g_mu_Xae_eu_ddi_deu_dus_n.length; eo++) {
				var di_deu_u_meud = g_mu_Xae_eu_ddi_deu_dus_n[eo];
				$_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__[di_deu_u_meud] = false;
			};

			runAfterButtons(function() {
				var di_deun = Object.keys($_xqXchi_ya_chad_X_ddi_deu_dus_nXqx__);
				for(ya = 0; ya < di_deun.length; ya++) {
					var u_meud = di_deun[ya];
					var chae_i_ae_g = dl_ekf_dml_th_su_ae_yu_eo_d_ch_s[X_myo_eu_ae_u_so].chae_i_ae_g;
					if(X_m_s_m.h_g_m_Xya_dus) {
						chae_i_ae_g = "rgb(255,255,255)";
					};
					//console.log(u_meud);
					//console.log(chae_i_ae_g);
					highlightButton(u_meud,chae_i_ae_g,7,2);
				};
			});
			
			var ryeo_u_u_yo_ddi_deu_dus_n = ["heejinite","heejinite_powder","molten_heejinite","heejinite_gas","haseulite","haseulite_powder","molten_haseulite","haseulite_gas","jinsoulite","jinsoulite_powder","molten_jinsoulite","jinsoulite_gas","haseulite_vent","loona","loona_gravel","molten_loona"].concat(g_mu_Xae_eu_ddi_deu_dus_n);

			var X_m_s_m = dl_ekf_dml_th_su_ae_yu_eo_d_ch_s[X_myo_eu_ae_u_so];
			for(ya = 0; ya < ryeo_u_u_yo_ddi_deu_dus_n.length; ya++) {
				var di_deu_u_meud = ryeo_u_u_yo_ddi_deu_dus_n[ya];
				var ya_u_rae = elements[di_deu_u_meud];
				var i_ae_ae_u_m_ssod_HTML = null;
				if(baseArray.includes(di_deu_u_meud)) {
					i_ae_ae_u_m_ssod_HTML = `<span style="${X_m_s_m.h_g_m_Xya_dus ? ('background: ' + X_m_s_m.chae_i_ae_g + '; background-clip: text; -webkit-background-clip: text; text-fill-color: transparent; -webkit-text-fill-color: transparent;') : ('color:' + X_m_s_m.chae_i_ae_g)}">Happy birthday, ${X_m_s_m.eu_deu_yu_d_g}!</span>`;
				} else {
					i_ae_ae_u_m_ssod_HTML = `<em style="${X_m_s_m.h_g_m_Xya_dus ? ('background: ' + X_m_s_m.chae_i_ae_g + '; background-clip: text; -webkit-background-clip: text; text-fill-color: transparent; -webkit-text-fill-color: transparent;') : ('color:' + X_m_s_m.chae_i_ae_g)}" onclick=g_d_hyan_s_d_g_ddi_deu_chi_ya_cha("${di_deu_u_meud}")>Happy birthday, ${X_m_s_m.eu_deu_yu_d_g}!</em>`
				};
				if(typeof(ya_u_rae.desc) === "undefined") {
					ya_u_rae.desc = i_ae_ae_u_m_ssod_HTML
				} else if(typeof(ya_u_rae.desc) === "string") {
					ya_u_rae.desc += ("<br/>" + i_ae_ae_u_m_ssod_HTML);
				};
			};
		};
		
	});
	

	runAfterLoad(function() {
		for(key in elements.water.reactions) {
			var value = JSON.parse(JSON.stringify(elements.water.reactions[key]));
			if(typeof(value.chance) === "number") {
				value.chance = Math.min(1,value.chance * 2);
			};
			if(value.elem2 === null && value.elem1 !== null) { 
				value.elem2 = value.elem1;
			};
			delete value.elem1;
			
			var movableJinsoulitoids = ["jinsoulite_powder","molten_jinsoulite","jinsoulite_gas"];
			for(j = 0; j < movableJinsoulitoids.length; j++) {
				var jinsoulitoid = movableJinsoulitoids[j];
				if(typeof(elements[jinsoulitoid].reactions) === "undefined") {
					elements[jinsoulitoid].reactions = {};
				};
				if(typeof(elements[jinsoulitoid].reactions[key]) === "undefined") {
					elements[jinsoulitoid].reactions[key] = value;
				};
			};
		};
	});
} else {
	if(!enabledMods.includes(loonaMod))				{ enabledMods.splice(enabledMods.indexOf(modName),0,loonaMod) };
	if(!enabledMods.includes(fireMod))				{ enabledMods.splice(enabledMods.indexOf(modName),0,fireMod) };
	if(!enabledMods.includes(runAfterAutogenMod))	{ enabledMods.splice(enabledMods.indexOf(modName),0,runAfterAutogenMod) };
	if(!enabledMods.includes(explodeAtPlusMod))		{ enabledMods.splice(enabledMods.indexOf(modName),0,explodeAtPlusMod) };
	if(!enabledMods.includes(libraryMod))			{ enabledMods.splice(enabledMods.indexOf(modName),0,libraryMod) };
	localStorage.setItem("enabledMods", JSON.stringify(enabledMods));
	alert(`The "${runAfterAutogenMod}", "${loonaMod}", "${fireMod}", "${libraryMod}", and "${explodeAtPlusMod}" mods are all required; any missing mods in this list have been automatically inserted (reload for this to take effect).`)
};
