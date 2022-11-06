var modName = "mods/mobs.js";
var runAfterAutogenMod = "mods/runAfterAutogen and onload restructure.js";
var explodeAtPlusMod = "mods/explodeAtPlus.js";

if(enabledMods.includes(runAfterAutogenMod) && enabledMods.includes(explodeAtPlusMod)) {
	//Prerequisite Functions and Variables

	maximumCreeperTries = 3;
	minimumCreeperTries = 1;
	maximumZombieTries = 3;
	minimumZombieTries = 3;

	headBodyObject = {
		"head": "body",
		"creeper_head": "creeper_body",
		"angelic_creeper_head": "angelic_creeper_body",
		"hell_creeper_head": "hell_creeper_body",
		"bombing_creeper_head": "bombing_creeper_body",
		"zombie_head": "zombie_body",
	};

	var style = document.createElement('style'); //Initialize CSS for creeper spawning's status indicator
	style.type = 'text/css';
	style.id = 'creeperStatusStylesheet';
	//initial style conditional branch
	if(typeof(settings.creeperSpawning) === "undefined") { //undefined (falsy but it needs special handling)
		style.innerHTML = '.creeperStatus { color: #E11; text-decoration: none; }';
	} else {
		if(!settings.creeperSpawning) { //falsy: red
			style.innerHTML = '.creeperStatus { color: #E11; text-decoration: none; }';
		} else if(settings.creeperSpawning) { //truthy: green
			style.innerHTML = '.creeperStatus { color: #1E1; text-decoration: none; }';
		};
	};
	document.getElementsByTagName('head')[0].appendChild(style);

	function pyth(xA,yA,xB,yB) { //Distance function, used for explosion trigger
		var a = Math.abs(xB - xA);
		var b = Math.abs(yB - yA);
		var c = Math.sqrt(a**2 + b**2);
		return c;
	};

	function rgbColorBound(number) { //RGB bounding function, used for safety checking color changes
		return Math.min(255,Math.max(0,number));
	};

	function slBound(number) { //SL bounding function (not hue), same use as above
		return Math.min(100,Math.max(0,number));
	};

	function angelicUpwardVelocity(pixel,x,y,radius,fire,smoke,power) { //Angelic Creeper's effect, "compatible" with velocity.js by including the modified version of its code in itself
		var info = elements[pixel.element]
		if(enabledMods.includes("mods/velocity.js")) {
			//console.log("yeet");
			// set the pixel.vx and pixel.vy depending on the angle and power
			if (!elements[pixel.element].excludeRandom) {
				//console.log("LOOKS LIKE IT'S YEETING TIME!");
				var angle = Math.atan2(pixel.y-y,pixel.x-x);
				//console.log(`angle calculated (${angle})`);
				pixel.vx = Math.round((pixel.vx|0) + Math.cos(angle) * (radius * power/10));
				//console.log(`vx calculated (${pixel.vx}) for pixel (${pixel.x},${pixel.y})`);
				pixel.vy = 0 - Math.abs(Math.round((pixel.vy|0) + Math.sin(angle) * (radius * power/4)) + 4); //massively increased Y velocities even for objects below
				//pixel.color = "rgb(255,0,0)";
				//console.log(`vy calculated (${pixel.vy}) for pixel (${pixel.x},${pixel.y})`);
			};
			//console.log(`Velocities set`);
		};
		//console.log(`end`);
	};

	//afterFunction(pixel,x,y,radius,fire,smoke,power,damage);
	function hellExplosionFire(pixel,x,y,radius,fire,smoke,power,damage) { //Angelic Creeper's effect, "compatible" with velocity.js by including the modified version of its code in itself
		var coords = circleCoords(pixel.x,pixel.y,radius);
		for (var i = 0; i < coords.length; i++) {
			var x = coords[i].x;
			var y = coords[i].y;
			if(!isEmpty(x,y,true)) {
				var pixel = pixelMap[x][y];
				var info = elements[pixel.element]
				if (info.burn) { //Light everything on fire
					pixel.burning = true;
					pixel.burnStart = pixelTicks;
					pixel.temp += 10; //smoke prevention
				} else if(Math.random() < 0.05) { //5%/px cursed burning
					pixel.burning = true;
					pixel.burnStart = pixelTicks;
					pixel.temp += 10;
				};
			} else if(isEmpty(x,y)) { //if there's space for fire
				if (Array.isArray(fire)) { //this should remain "fire"
					var newfire = fire[Math.floor(Math.random() * fire.length)];
				} else {
					var newfire = fire;
				};
				createPixel(newfire,x,y); //add fire
				var firePixel = pixelMap[x][y];
				firePixel.temp = Math.max(elements[newfire].temp,firePixel.temp);
				firePixel.burning = true;
			};
		};
	};

	//explodeAtPlus moved to separate file

	if(typeof(settings.creeperSpawning) === "undefined") { //Default creeper setting
		setSetting("creeperSpawning",false);
	};

	function updateCreeperPreferences() { //Creeper setting handler
		if(settings.creeperSpawning) { //If the setting is on
			if(typeof(randomEvents.creeper) !== "function") { //add the event if it's missing
				randomEvents.creeper = function() {
					var amount = Math.floor((Math.random() * maximumCreeperTries)+minimumCreeperTries); //1-3
					//In worldgen worlds, you can expect about half of this because about half of the world is pixels in it.
					for(i = 0; i < amount; i++) { //dummy for to break
						if(settings.creeperSpawning) { //setting validation
							// random x between 1 and width-1
							var x = Math.floor(Math.random()*(width-1))+1;
							// random y between 1 and height
							var y = Math.floor(Math.random()*height-1)+1;
							if (isEmpty(x,y)) {
								// random element from the list of spawnable creepers
								var element = spawnCreepers[Math.floor(Math.random()*spawnCreepers.length)];
								// if element is an array, choose a random element from the array
								if (Array.isArray(element)) {
									element = element[Math.floor(Math.random()*element.length)];
								}
								createPixel(element,x,y);
							};
						} else { //if false (this function is never supposed to fire with the setting false)
							delete randomEvents.creeper; //self-disable
							//substitute event
							var event = randomEvents[Object.keys(randomEvents)[Math.floor(Math.random()*Object.keys(randomEvents).length)]];
							event();
							break;
						};
					};
				};
			};
		} else if(!settings.creeperSpawning) { //and if it's off
			if(randomEvents.creeper) { delete randomEvents.creeper }; //delete it if it exists.
		};
	};

	function toggleCreeperSpawning() { //Creeper toggle handler
		if(settings.creeperSpawning != true) { //If it's false
			setSetting("creeperSpawning",true); //make it true and update the status display CSS
			updateCreeperPreferences(); //apply
			document.getElementById("creeperStatusStylesheet").innerHTML = '.creeperStatus { color: #1E1; text-decoration: underline; }'; //Displayed info doen't update until it's pulled up again, so I'm using CSS to dynamically change the color of an element, like with find.js (RIP).
		} else { //and the inverse if it's true
			setSetting("creeperSpawning",false);
			updateCreeperPreferences();
			document.getElementById("creeperStatusStylesheet").innerHTML = '.creeperStatus { color: #E11; text-decoration: none; }';
		};
	};
	
	//Functions used by Nothing There

	function hasPixel(x,y,elementInput) {
		if(isEmpty(x,y,true)) { //if empty, it can't have a pixel
			return false;
		} else {
			if(elementInput.includes(",")) { //CSTA
				elementInput = elementInput.split(",");
			};
			if(Array.isArray(elementInput)) { //if element list
				return elementInput.includes(pixelMap[x][y].element);
			} else { //if single element
				return pixelMap[x][y].element === elementInput;
			};
		};		
	};

	function breakPixel(pixel,changetemp=false,defaultBreakIntoDust=false) {
		var info = elements[pixel.element];
		if(typeof(info.breakInto) === "undefined") {
			if(defaultBreakIntoDust) {
				if(Math.random() < defaultBreakIntoDust) { changePixel(pixel,"dust",changetemp) };
			};
			return defaultBreakIntoDust;
		};
		var breakIntoElement = info.breakInto;
		if(Array.isArray(breakIntoElement)) {
			breakIntoElement = breakIntoElement[Math.floor(Math.random() * breakIntoElement.length)]
		};
		changePixel(pixel,breakIntoElement,changetemp)
		return true;
	};

	defaultHardness = 0;

	function tryBreak(pixel,changetemp=false,defaultBreakIntoDust=false) {
		var info = elements[pixel.element];
		var hardness = defaultHardness;
		if(typeof(info.hardness) === "number") {
			hardness = info.hardness;
		};
		hardness = 1 - hardness; //invert hardness, so a hardness of 0 becomes a 100% chance and a hardness of 1 becomes a 0% chance
		if(Math.random() < hardness) {
			return breakPixel(pixel,changetemp=false,defaultBreakIntoDust=false);
		} else {
			return false;
		};
	};

	function nothingThereBulletMovement(pixel,x,y) {
		if(!tryMove(pixel,x,y)) {
			if(!isEmpty(x,y,true)) {
				var thisDensity = elements[pixel.element].density;
				var newPixel = pixelMap[x][y];
				var newElement = newPixel.element;
				var newInfo = elements[newElement];
				var newHardness = 0;
				if(nothingThereBulletExcludedElements.includes(newElement)) {
					return false;
				};
				if(typeof(newInfo.hardness) === "number") {
					newHardness = newInfo.hardness;
					//it's inverted later
				};
				if(typeof(newInfo.state) === "undefined" && newElement !== pixel.element) { //Copy-paste of "break" code
					if(Math.random() < ((1 - newHardness) ** 0.6)) {
						swapPixels(pixel,newPixel);
						//console.log(`nothingThereBulletMovement: Breaking pixel (${newPixel.element}, ${newPixel.x}, ${newPixel.y}))`)
						breakPixel(newPixel,false,0.3);
						return true;
					} else {
						deletePixel(pixel.x,pixel.y);
						return false;
					};
				} else {
					if(newElement == pixel.element) {
						swapPixels(pixel,newPixel);
						return true;
					} else if(newInfo.state == "gas") {
						swapPixels(pixel,newPixel);
						return true;
					} else if(newInfo.state == "liquid") {
						var newDensity = 1000;
						if(typeof(newInfo.density) === "number") {
							newDensity = newInfo.density;
							//console.log(`density ${newInfo.density} for ${newElement}`);   
						//} else {
							//console.log(`undef density for ${newElement}, 1000 default`);   
						};
						//console.log(`thisDensity: ${thisDensity}`);
						//console.log(`newDensity: ${newDensity}`);
						var chance = thisDensity/(thisDensity+newDensity);
						//console.log(`${newElement}, ${chance}`)
						if(Math.random() < chance) {
							swapPixels(pixel,newPixel);
						};
						return true;
					} else if(newInfo.state == "solid") {
						if(Math.random() < ((1 - newHardness) ** 0.6)) {
							swapPixels(pixel,newPixel);
							//console.log(`nothingThereBulletMovement: Breaking pixel (${newPixel.element}, ${newPixel.x}, ${newPixel.y}))`)
							breakPixel(newPixel,false,0.3);
							return true;
						} else {
							deletePixel(pixel.x,pixel.y);
							return false;
						};
					};
				};
			} else {
				return false;
			};
		} else {
			return true;
		};
	};

	//End NT functions

	nothingThereBulletExcludedElements = ["wall","nothing_there_phase_1","nothing_there_phase_2","nothing_there_phase_3_body","nothing_there_phase_3_head", "nothing_there_cleaver", "nothing_there_mace"];

	enemyHumanoidArray = ["head","body"] //just in case

	spawnCreepers = ["creeper","baby_creeper","angelic_creeper","bombing_creeper","hell_creeper"];

	if(settings.creeperSpawning) { //creeper spawning option
		randomEvents.creeper = function() {
			var amount = Math.floor((Math.random() * maximumCreeperTries)+minimumCreeperTries); //1-3
			for(i = 0; i < amount; i++) { //dummy for to break
				if(settings.creeperSpawning) { //setting validation
					// random x between 1 and width-1
					var x = Math.floor(Math.random()*(width-1))+1;
					// random y between 1 and height
					var y = Math.floor(Math.random()*height-1)+1;
					if (isEmpty(x,y)) {
						// random element from the list of spawnable creepers
						var element = spawnCreepers[Math.floor(Math.random()*spawnCreepers.length)];
						// if element is an array, choose a random element from the array
						if (Array.isArray(element)) {
							element = element[Math.floor(Math.random()*element.length)];
						}
						createPixel(element,x,y);
					};
				} else { //if false (this function is never supposed to fire with the setting false)
					delete randomEvents.creeper; //self-disable
					//substitute event
					var event = randomEvents[Object.keys(randomEvents)[Math.floor(Math.random()*Object.keys(randomEvents).length)]];
					event();
					break;
				};
			};
		};
	};

	standaloneSpawnCreeper = function(amount=1) {
		/*	The amount is the maximum amount of *attempts*. Often, less creepers will spawn due to things in the way.
			In a generated world, which uses half of the space, you can expect about half of this number to spawn.	*/
		for(i = 0; i < amount; i++) { //dummy for to break
			// random x between 1 and width-1
			var x = Math.floor(Math.random()*(width-1))+1;
			// random y between 1 and height
			var y = Math.floor(Math.random()*height-1)+1;
			if (isEmpty(x,y)) {
				// random element from the list of spawnable creepers
				var element = spawnCreepers[Math.floor(Math.random()*spawnCreepers.length)];
				// if element is an array, choose a random element from the array
				if (Array.isArray(element)) {
					element = element[Math.floor(Math.random()*element.length)];
				}
				createPixel(element,x,y);
			};
		};
	};

	//Prerequisite Functions and Variables

	function getKeyByValue(object, value) {
	  return Object.keys(object).find(key => object[key] === value);
	}
	//getKeyByValue code by UncleLaz on StackOverflow: https://stackoverflow.com/questions/9907419/how-to-get-a-key-in-a-javascript-object-by-its-value"

	function headHasBody(pixel) {
		var pX = pixel.x;
		var pY = pixel.y;
		//console.log("Checking head for body");
		if(Object.keys(headBodyObject).includes(pixel.element)) {
			//console.log("The head has a corresponding body element.");
			if(typeof(pixelMap[pX][pY+1]) === "undefined") {
				//console.log("The body's place is empty.");
				return false;
			} else {
				var bodyPixel = pixelMap[pX][pY+1];
				//console.log("The body's place is not empty.");
				return (bodyPixel.element === headBodyObject[pixel.element]);
			};
		} else {
			//console.log("The head does not have corresponding body element.");
			return null;
		};
	};

	function bodyHasHead(pixel) {
		var pX = pixel.x;
		var pY = pixel.y;
		//console.log("Checking body for head");
		if(Object.values(headBodyObject).includes(pixel.element)) {
			//console.log("The body has a corresponding head element.");
			if(typeof(pixelMap[pX][pY-1]) === "undefined") {
				//console.log("The head's place is empty.");
				return false;
			} else {
				var headPixel = pixelMap[pX][pY-1];
				//console.log("The head's place is not empty.");
				return (headPixel.element === getKeyByValue(headBodyObject,pixel.element));
			};
		} else {
			//console.log("The body does not have corresponding head element.");
			return null;
		};
	};

	function zombifyHuman(pixel) {
		var pX = pixel.x;
		var pY = pixel.y;
		if(!["head","body"].includes(pixel.element)) {
			//console.log("Not part of a human");
			return false;
		} else {
			if(pixel.element === "head") {
				//console.log("Head");
				if(headHasBody(pixel)) {
					//console.log("There's also a body");
					var body = pixelMap[pX][pY+1];
					changePixel(body,"zombie_body",false);
					//console.log("Body turned (head path)");
				};
				changePixel(pixel,"zombie_head");
				//console.log("Head turned (head path)");
			} else {
				//console.log("Not head (i.e. body)");
				if(bodyHasHead(pixel)) {
					//console.log("There's also a head");
					var head = pixelMap[pX][pY-1];
					changePixel(head,"zombie_head",false);
					//console.log("Head turned (body path)");
				};
				changePixel(pixel,"zombie_body");
				//console.log("Body turned (body path)");
			};
		};
	};

	function dezombifyHuman(pixel) {
		var pX = pixel.x;
		var pY = pixel.y;
		if(!["zombie_head","zombie_body"].includes(pixel.element)) {
			return false;
		} else {
			if(pixel.element === "zombie_head") {
				if(headHasBody(pixel)) {
					var body = pixelMap[pX][pY+1];
					changePixel(body,"body",false);
				};
				changePixel(pixel,"head");
			} else {
				if(bodyHasHead(pixel)) {
					var head = pixelMap[pX][pY-1];
					changePixel(head,"head",false);
				};
				changePixel(pixel,"body");
			};
		};
	};

	elements.frozen_rotten_meat = {
		color: ["#8FB588", "#8FA888"],
		behavior: [
			"XX|CR:plague,stench,stench%0.125 AND CH:meat>rotten_meat%1 AND CH:frozen_meat>frozen_rotten_meat%0.85|XX",
			"SP%99 AND CH:meat>rotten_meat%1 AND CH:frozen_meat>frozen_rotten_meat%0.85|XX|SP%99 AND CH:meat>rotten_meat%1 AND CH:frozen_meat>frozen_rotten_meat%0.85",
			"XX|M1 AND CH:meat>rotten_meat%1 AND CH:frozen_meat>frozen_rotten_meat%0.85|XX",
		],
		temp: -18,
		tempHigh: 0,
		stateHigh: "rotten_meat",
		category:"food",
		hidden:true,
		state: "solid",
		density: 1037.5,
	};

	elements.rotten_meat.tempLow = -18;
	elements.rotten_meat.stateLow = "frozen_rotten_meat";

	elements.zombie_blood = {
		color: ["#d18228", "#9a9e2f"],
		behavior: behaviors.LIQUID,
		reactions: {
			"vaccine": { "elem2":null, "chance": 0.01 },
			"plague": { "elem2":null, "chance": 0.01 },
			"virus": { "elem2":null, "chance": 0.01 },
			"cancer": { "elem1":"cancer", "chance": 0.02 },
			/*"rat": { "elem2":"infection", "chance":0.075 },
			"flea": { "elem1":"infection", "chance":0.03 },
			"dirt": { "elem1":null, "elem2":"mud" },
			"sand": { "elem1":null, "elem2":"wet_sand" },
			"mercury": { "elem1":"infection", "elem2":null, "chance":0.05 },
			"carbon_dioxide": { "elem2":null, "chance":0.05 },
			"alcohol": { "elem1":[null,"dna"], "chance":0.02 },*/
			"oxygen": { "elem2":null, "chance":0.04 },
			"blood": { "elem2":"zombie_blood", "chance":0.1 },
		},
		viscosity: 30,
		tempHigh: 127.55,
		stateHigh: ["steam","salt","oxygen","plague"],
		tempLow: 0,
		category:"liquids",
		state: "liquid",
		density: 1160,
		stain: 0.06,
		tick: function(pixel) {
			if(Math.random() < 0.2) {
				var pX = pixel.x;
				var pY = pixel.y;
				for(i = 0; i < adjacentCoords.length; i++) {
					var coord = adjacentCoords[i];
					var oX = coord[0];
					var oY = coord[1];
					var nX = pX+oX;
					var nY = pY+oY;
					if(isEmpty(nX,nY,true)) {
						continue;
					} else {
						var newPixel = pixelMap[nX][nY];
						var newElement = newPixel.element;
						if(enemyHumanoidArray.includes(newElement)) {
							if(Math.random() < 0.1) { zombifyHuman(newPixel) };
						};
					};
				};
			};
		},
	};

	var style = document.createElement('style'); //Initialize CSS for zombie spawning's status indicator
	style.type = 'text/css';
	style.id = 'zombieStatusStylesheet';
	//initial style conditional branch
	if(typeof(settings.zombieSpawning) === "undefined") { //undefined (falsy but it needs special handling)
		style.innerHTML = '.zombieStatus { color: #E11; text-decoration: none; }';
	} else {
		if(!settings.zombieSpawning) { //falsy: red
			style.innerHTML = '.zombieStatus { color: #E11; text-decoration: none; }';
		} else if(settings.zombieSpawning) { //truthy: green
			style.innerHTML = '.zombieStatus { color: #1E1; text-decoration: none; }';
		};
	};
	document.getElementsByTagName('head')[0].appendChild(style);

	if(typeof(settings.zombieSpawning) === "undefined") { //Default zombie setting
		setSetting("zombieSpawning",false);
	};

	function updateZombiePreferences() { //Zombie setting handler
		if(settings.zombieSpawning) { //If the setting is on
			if(typeof(randomEvents.zombie) !== "function") { //add the event if it's missing
				randomEvents.zombie = function() {
					var amount = Math.floor((Math.random() * maximumZombieTries)+minimumZombieTries); //1-3
					//In worldgen worlds, you can expect about half of this because about half of the world is pixels in it.
					for(i = 0; i < amount; i++) { //dummy for to break
						if(settings.zombieSpawning) { //setting validation
							// random x between 1 and width-1
							var x = Math.floor(Math.random()*(width-1))+1;
							// random y between 1 and height
							var y = Math.floor(Math.random()*height-1)+1;
							if (isEmpty(x,y)) {
								// random element from the list of spawnable zombies
								var element = spawnZombies[Math.floor(Math.random()*spawnZombies.length)];
								// if element is an array, choose a random element from the array
								if (Array.isArray(element)) {
									element = element[Math.floor(Math.random()*element.length)];
								}
								createPixel(element,x,y);
							};
						} else { //if false (this function is never supposed to fire with the setting false)
							delete randomEvents.zombie; //self-disable
							//substitute event
							var event = randomEvents[Object.keys(randomEvents)[Math.floor(Math.random()*Object.keys(randomEvents).length)]];
							event();
							break;
						};
					};
				};
			};
		} else if(!settings.zombieSpawning) { //and if it's off
			if(randomEvents.zombie) { delete randomEvents.zombie }; //delete it if it exists.
		};
	};

	function toggleZombieSpawning() { //Zombie toggle handler
		if(settings.zombieSpawning != true) { //If it's false
			setSetting("zombieSpawning",true); //make it true and update the status display CSS
			updateZombiePreferences(); //apply
			document.getElementById("zombieStatusStylesheet").innerHTML = '.zombieStatus { color: #1E1; text-decoration: underline; }'; //Displayed info doen't update until it's pulled up again, so I'm using CSS to dynamically change the color of an element, like with find.js (RIP).
		} else { //and the inverse if it's true
			setSetting("zombieSpawning",false);
			updateZombiePreferences();
			document.getElementById("zombieStatusStylesheet").innerHTML = '.zombieStatus { color: #E11; text-decoration: none; }';
		};
	};

	spawnZombies = ["zombie","baby_zombie"];

	if(settings.zombieSpawning) { //zombie spawning option
		randomEvents.zombie = function() {
			var amount = Math.floor((Math.random() * maximumZombieTries)+minimumZombieTries); //1-3
			for(i = 0; i < amount; i++) { //dummy for to break
				if(settings.zombieSpawning) { //setting validation
					// random x between 1 and width-1
					var x = Math.floor(Math.random()*(width-1))+1;
					// random y between 1 and height
					var y = Math.floor(Math.random()*height-1)+1;
					if (isEmpty(x,y)) {
						// random element from the list of spawnable zombies
						var element = spawnZombies[Math.floor(Math.random()*spawnZombies.length)];
						// if element is an array, choose a random element from the array
						if (Array.isArray(element)) {
							element = element[Math.floor(Math.random()*element.length)];
						}
						createPixel(element,x,y);
					};
				} else { //if false (this function is never supposed to fire with the setting false)
					delete randomEvents.zombie; //self-disable
					//substitute event
					var event = randomEvents[Object.keys(randomEvents)[Math.floor(Math.random()*Object.keys(randomEvents).length)]];
					event();
					break;
				};
			};
		};
	};

	standaloneSpawnZombie = function(amount=1) {
		/*	The amount is the maximum amount of *attempts*. Often, less zombies will spawn due to things in the way.
			In a generated world, which uses half of the space, you can expect about half of this number to spawn.	*/
		for(i = 0; i < amount; i++) { //dummy for to break
			// random x between 1 and width-1
			var x = Math.floor(Math.random()*(width-1))+1;
			// random y between 1 and height
			var y = Math.floor(Math.random()*height-1)+1;
			if (isEmpty(x,y)) {
				// random element from the list of spawnable zombies
				var element = spawnZombies[Math.floor(Math.random()*spawnZombies.length)];
				// if element is an array, choose a random element from the array
				if (Array.isArray(element)) {
					element = element[Math.floor(Math.random()*element.length)];
				}
				createPixel(element,x,y);
			};
		};
	};

	/*Start Main Zombie
		..................
		.........###......
		.......#######....
		......#####OOOOO..
		....######OOOOOOO.
		...########OOOOO..
		...###########....
		...###########....
		...###########....
		....##########....
		......########....
		.......##...##....
		.......##...##....
		..................
	*/

	elements.zombie = {
		color: ["#567C44","#199A9A","#41369B"],
		category: "life",
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			following: false,
		},
		movable: true,
		tick: function(pixel) {
			if (isEmpty(pixel.x, pixel.y+1)) {
				createPixel("zombie_body", pixel.x, pixel.y+1);
				pixel.element = "zombie_head";
				pixel.color = pixelColorPick(pixel)
			}
			else if (isEmpty(pixel.x, pixel.y-1)) {
				createPixel("zombie_head", pixel.x, pixel.y-1);
				pixelMap[pixel.x][pixel.y-1].color = pixel.color;
				pixel.element = "zombie_body";
				pixel.color = pixelColorPick(pixel)
			}
			else {
				deletePixel(pixel.x, pixel.y);
			}
		},
		related: ["zombie_body","zombie_head"],
		desc: "<em>I'd rather this be toggleable mid-game than require a reload.</em><br/><br/><span class=\"zombieStatus\">If this text is green or underlined, zombies (all types) can spawn.</span> <span onclick=toggleZombieSpawning() style=\"color: #ff00ff;\";>Click here</span> to toggle zombie spawning. If it's on, zombies can spawn through random events."
	};

	elements.zombie_body = {
		color: "#27719D",
		category: "life",
		hidden: true,
		density: 1500,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "rotten_meat",
		tempLow: -30,
		stateLow: "frozen_rotten_meat",
		burn: 10,
		burnTime: 250,
		burnInto: "rotten_meat",
		breakInto: ["zombie_blood","rotten_meat"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","rotten_meat","rotten_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.025 },
		},
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
		},
		movable: true,
		tick: function(pixel) {
			if (tryMove(pixel, pixel.x, pixel.y+1)) { // Fall
				if (!isEmpty(pixel.x, pixel.y-2, true)) { // Drag head down
					var headPixel = pixelMap[pixel.x][pixel.y-2];
					if (headPixel.element == "zombie_head") {
						if (isEmpty(pixel.x, pixel.y-1)) {
							movePixel(pixelMap[pixel.x][pixel.y-2], pixel.x, pixel.y-1);
						}
						else {
							swapPixels(pixelMap[pixel.x][pixel.y-2], pixelMap[pixel.x][pixel.y-1]);
						}
					}
				}
			}
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 100
				if (pixelTicks-pixel.dead > 100) {
					changePixel(pixel,"rotten_meat");
				};
				return;
			};

			// Find the head
			if (!isEmpty(pixel.x, pixel.y-1, true)) {
				if(pixelMap[pixel.x][pixel.y-1].element == "head") {
					changePixel(pixelMap[pixel.x][pixel.y-1],"zombie_head");
				} else if(pixelMap[pixel.x][pixel.y-1].element == "zombie_head") {
					var head = pixelMap[pixel.x][pixel.y-1];
					if (head.dead) { // If head is dead, kill body
						pixel.dead = head.dead;
					};
				} else {
					var head = null;
				};
			} else { var head = null };

			if (isEmpty(pixel.x, pixel.y-1)) {
				// create zombie blood if decapitated 10% chance
				if (Math.random() < 0.1) {
					createPixel("zombie_blood", pixel.x, pixel.y-1);
					// set dead to true 10% chance
					if (Math.random() < 0.10) {
						pixel.dead = pixelTicks;
					}
				}
			}
			else if (head == null) { return }
			else if (Math.random() < 0.1) { // Move 10% chance
				var movesToTry = [
					[1*pixel.dir,0],
					[1*pixel.dir,-1],
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
						if (tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
							movePixel(head, head.x+move[0], head.y+move[1]);
							break;
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!head.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};
		},
	};

	elements.zombie_head = {
		color: "#567C44",
		category: "life",
		hidden: true,
		density: 1500,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "rotten_meat",
		tempLow: -30,
		stateLow: "frozen_rotten_meat",
		burn: 10,
		burnTime: 250,
		burnInto: "rotten_meat",
		breakInto: ["zombie_blood","rotten_meat"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","rotten_meat","rotten_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.025 },
		},
		properties: {
			dead: false,
			following: false,
			dir: 1,
			panic: 0,
		},
		movable: true,
		tick: function(pixel) {
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 100
				if (pixelTicks-pixel.dead > 100) {
					changePixel(pixel,"rotten_meat");
				};
				return;
			};

			// Find the body
			if (!isEmpty(pixel.x, pixel.y+1, true)) {
				if(pixelMap[pixel.x][pixel.y+1].element == "body") {
					changePixel(pixelMap[pixel.x][pixel.y+1],"zombie_body");
				} else if(pixelMap[pixel.x][pixel.y+1].element == "zombie_body") {
					var body = pixelMap[pixel.x][pixel.y+1];
					if (body.dead) { // If body is dead, kill body
						pixel.dead = body.dead;
					};
				} else {
					var body = null;
				};
			} else { var body = null };

			if(body) {
				if(body.dir !== pixel.dir) { //hacky workaround: lock head dir to body dir
					pixel.dir = body.dir;
				};
			};

			if (isEmpty(pixel.x, pixel.y+1)) {
				tryMove(pixel, pixel.x, pixel.y+1);
				// create zombie blood if severed 10% chance
				if (isEmpty(pixel.x, pixel.y+1) && !pixel.dead && Math.random() < 0.1) {
					createPixel("zombie_blood", pixel.x, pixel.y+1);
					// set dead to true 10% chance
					if (Math.random() < 0.10) {
						pixel.dead = pixelTicks;
					}
				}
			}
			
			//start of most new code
			var pX = pixel.x;
			var pY = pixel.y;
			
			//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
			if(pixelTicks % 2 == 0) { //reduce rate for performance
				/*var directionAdverb = "left";
				if(pixel.dir > 0) {
					directionAdverb = "right";
				};*/
				//console.log(`Looking ${directionAdverb}`)
				if(pixel.dir === -1) {
					for(i = -4; i < 4+1; i++) {
						var oY = i;
						//console.log(`Starting row look at row ${pY+oY}`)
						for(j = (-1); j > (-35 - 1); j--) {
							var oX = j;
							var nX = pX+oX;
							var nY = pY+oY;
							if(outOfBounds(nX,nY)) {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
								break;
							};
							if(isEmpty(nX,nY)) {
								////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
								continue;
							};
							if(!isEmpty(nX,nY,true)) {
								var newPixel = pixelMap[nX][nY];
								var newElement = newPixel.element;
								if(enemyHumanoidArray.includes(newElement)) {
									//console.log(`Human part found at (${nX},${nY})`)
									if(!newPixel.dead) { //If not dead
										pixel.following = true;
										//console.log(`Human detected at (${nX},${nY})`)
										//Infect/kill if a human is close enough
										if(pyth(pX,pY,nX,nY) <= 1.5) { //approx. sqrt(2)
											if(Math.random() < 1/3) {	//One-third chance to mutilate (changePixel)
												if(Math.random() < 1/3) {	//One-third chance to change to blood
													changePixel(newPixel,"zombie_blood",false); //blood is turned in place
												} else {					//Remaining 2/3 chance to change to rotten flesh
													changePixel(newPixel,"rotten_meat",false);
												};
											} else {					//Remaining 2/3 chance to turn the human
												zombifyHuman(newPixel);
											};
										};
									} else { //Mutilate if dead
										if(Math.random() < 1/3) {	//One-third chance to change to blood
											changePixel(newPixel,"zombie_blood",false); //blood is turned in place
										} else {					//Remaining 2/3 chance to change to rotten flesh
											changePixel(newPixel,"rotten_meat",false);
										};
									};
								} else {
									//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
									break; //can't see through humans
								};
							};
						};
					};
				} else if(pixel.dir === 1) {
					for(i = -4; i < 4+1; i++) {
						var oY = i;
						//console.log(`Starting row look at row ${pY+oY}`)
						for(j = 1; j < 35 + 1; j++) {
							var oX = j;
							var nX = pX+oX;
							var nY = pY+oY;
							if(outOfBounds(nX,nY)) {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
								break;
							};
							if(isEmpty(nX,nY)) {
								////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
								continue;
							};
							if(!isEmpty(nX,nY,true)) {
								var newPixel = pixelMap[nX][nY];
								var newElement = newPixel.element;
								if(enemyHumanoidArray.includes(newElement)) {
									//console.log(`Human part found at (${nX},${nY})`)
									if(!newPixel.dead) { //If not dead
										pixel.following = true;
										//console.log(`Human detected at (${nX},${nY})`)
										//Infect/kill if a human is close enough
										if(pyth(pX,pY,nX,nY) <= 1.5) { //approx. sqrt(2)
											if(Math.random() < 1/3) {	//One-third chance to mutilate (changePixel)
												if(Math.random() < 1/3) {	//One-third chance to change to blood
													changePixel(newPixel,"zombie_blood",false); //blood is turned in place
												} else {					//Remaining 2/3 chance to change to rotten flesh
													changePixel(newPixel,"rotten_meat",false);
												};
											} else {					//Remaining 2/3 chance to turn the human
												zombifyHuman(newPixel);
											};
										};
									} else { //Mutilate if dead
										if(Math.random() < 1/3) {	//One-third chance to change to blood
											changePixel(newPixel,"zombie_blood",false); //blood is turned in place
										} else {					//Remaining 2/3 chance to change to rotten flesh
											changePixel(newPixel,"rotten_meat",false);
										};
									};
								} else {
									//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
									break; //can't see through humans
								};
							};
						};
					};
				};
			};
					
			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};
		},
	};

		//Baby Zombie

	elements.baby_zombie = {
		color: "#199A9A",
		category: "life",
		hidden: true,
		density: 1500,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "rotten_meat",
		tempLow: -30,
		stateLow: "frozen_rotten_meat",
		burn: 10,
		burnTime: 250,
		burnInto: "rotten_meat",
		breakInto: ["zombie_blood","rotten_meat"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","rotten_meat","rotten_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.025 },
		},
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
		},
		movable: true,
		tick: function(pixel) {
			tryMove(pixel, pixel.x, pixel.y+1); // Fall
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 100
				if (pixelTicks-pixel.dead > 100) {
					changePixel(pixel,"rotten_meat");
				};
				return;
			};

			if (Math.random() < 0.15) { // Move 10% chance
				var movesToTry = [
					[1*pixel.dir,0],	//dash move
					[1*pixel.dir,-1],	//slash move
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
						if(tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
							break;
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!pixel.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};

			var pX = pixel.x;
			var pY = pixel.y;

			//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
			if(pixelTicks % 2 == 0) { //reduce rate for performance
				/*var directionAdverb = "left";
				if(pixel.dir > 0) {
					directionAdverb = "right";
				};*/
				//console.log(`Looking ${directionAdverb}`)
				if(pixel.dir === -1) {
					for(i = -4; i < 4+1; i++) {
						var oY = i;
						//console.log(`Starting row look at row ${pY+oY}`)
						for(j = (-1); j > (-35 - 1); j--) {
							var oX = j;
							var nX = pX+oX;
							var nY = pY+oY;
							if(outOfBounds(nX,nY)) {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
								break;
							};
							if(isEmpty(nX,nY)) {
								////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
								continue;
							};
							if(!isEmpty(nX,nY,true)) {
								var newPixel = pixelMap[nX][nY];
								var newElement = newPixel.element;
								if(enemyHumanoidArray.includes(newElement)) {
									//console.log(`Human part found at (${nX},${nY})`)
									if(!newPixel.dead) { //If not dead
										pixel.following = true;
										//console.log(`Human detected at (${nX},${nY})`)
										//Infect/kill if a human is close enough
										if(pyth(pX,pY,nX,nY) <= 1.5) { //approx. sqrt(2)
											if(Math.random() < 1/3) {	//One-third chance to mutilate (changePixel)
												if(Math.random() < 1/4) {	//One-fourth chance to change to blood
													changePixel(newPixel,"zombie_blood",false); //blood is turned in place
												} else {					//Remaining 3/4 chance to change to rotten flesh
													changePixel(newPixel,"rotten_meat",false);
												};
											} else {					//Remaining 2/3 chance to turn the human
												zombifyHuman(newPixel);
											};
										};
									} else { //Mutilate if dead
										if(Math.random() < 1/4) {	//One-fourth chance to change to blood
											changePixel(newPixel,"zombie_blood",false); //blood is turned in place
										} else {					//Remaining 3/4 chance to change to rotten flesh
											changePixel(newPixel,"rotten_meat",false);
										};
									};
								} else {
									//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
									break; //can't see through humans
								};
							};
						};
					};
				} else if(pixel.dir === 1) {
					for(i = -4; i < 4+1; i++) {
						var oY = i;
						//console.log(`Starting row look at row ${pY+oY}`)
						for(j = 1; j < 35 + 1; j++) {
							var oX = j;
							var nX = pX+oX;
							var nY = pY+oY;
							if(outOfBounds(nX,nY)) {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
								break;
							};
							if(isEmpty(nX,nY)) {
								////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
								continue;
							};
							if(!isEmpty(nX,nY,true)) {
								var newPixel = pixelMap[nX][nY];
								var newElement = newPixel.element;
								if(enemyHumanoidArray.includes(newElement)) {
									//console.log(`Human part found at (${nX},${nY})`)
									if(!newPixel.dead) { //If not dead
										pixel.following = true;
										//console.log(`Human detected at (${nX},${nY})`)
										//Infect/kill if a human is close enough
										if(pyth(pX,pY,nX,nY) <= 1.5) { //approx. sqrt(2)
											if(Math.random() < 1/3) {	//One-third chance to mutilate (changePixel)
												if(Math.random() < 1/4) {	//One-fourth chance to change to blood
													changePixel(newPixel,"zombie_blood",false); //blood is turned in place
												} else {					//Remaining 3/4 chance to change to rotten flesh
													changePixel(newPixel,"rotten_meat",false);
												};
											} else {					//Remaining 2/3 chance to turn the human
												zombifyHuman(newPixel);
											};
										};
									} else { //Mutilate if dead
										if(Math.random() < 1/4) {	//One-fourth chance to change to blood
											changePixel(newPixel,"zombie_blood",false); //blood is turned in place
										} else {					//Remaining 3/4 chance to change to rotten flesh
											changePixel(newPixel,"rotten_meat",false);
										};
									};
								} else {
									//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
									break; //can't see through humans
								};
							};
						};
					};
				};
			};
					
			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};
		},
		related: ["zombie"],
		desc: "Baby zombies: smaller, faster, and more annoying.",
	};

	/*Start Main Creeper
		##################
		#########   ######
		#######       ####
		######     OOOOO##
		####      OOOOOOO#
		###        OOOOO##
		###           ####
		###           ####
		###           ####
		####          ####
		######        ####
		#######  ###  ####
		#######  ###  ####
		##################
	*/

	elements.creeper = {
		color: ["#D2D2D2", "#BFDFB9", "#94CE89", "#78D965", "#5ED54C", "#58C546", "#50B143", "#479143", "#559552", "#3F8738", "#5B8B59"],
		category: "life",
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			following: false,
		},
		movable: true,
		tick: function(pixel) {
			if (isEmpty(pixel.x, pixel.y+1)) {
				createPixel("creeper_body", pixel.x, pixel.y+1);
				pixel.element = "creeper_head";
				pixel.color = pixelColorPick(pixel)
			}
			else if (isEmpty(pixel.x, pixel.y-1)) {
				createPixel("creeper_head", pixel.x, pixel.y-1);
				pixelMap[pixel.x][pixel.y-1].color = pixel.color;
				pixel.element = "creeper_body";
				pixel.color = pixelColorPick(pixel)
			}
			else {
				deletePixel(pixel.x, pixel.y);
			}
		},
		related: ["creeper_body","creeper_head"],
		desc: "<em>I'd rather this be toggleable mid-game than require a reload.</em><br/><br/><span class=\"creeperStatus\">If this text is green or underlined, creepers can spawn.</span> <span onclick=toggleCreeperSpawning() style=\"color: #ff00ff;\";>Click here</span> to toggle creeper spawning. If it's on, creepers (all types) can spawn through random events."
	};

	elements.creeper_body = {
		color: ["#D2D2D2", "#BFDFB9", "#94CE89", "#78D965", "#5ED54C", "#58C546", "#50B143", "#479143", "#559552", "#3F8738", "#5B8B59"],
		category: "life",
		hidden: true,
		density: 1500,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "cooked_meat",
		tempLow: -30,
		stateLow: "frozen_meat",
		burn: 10,
		burnTime: 250,
		burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","gunpowder"],
		breakInto: ["blood","gunpowder"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.05 },
		},
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			charged: false,
			didChargeBlueTinted: false,
		},
		movable: true,
		tick: function(pixel) {
			if (tryMove(pixel, pixel.x, pixel.y+1)) { // Fall
				if (!isEmpty(pixel.x, pixel.y-2, true)) { // Drag head down
					var headPixel = pixelMap[pixel.x][pixel.y-2];
					if (headPixel.element == "creeper_head") {
						if (isEmpty(pixel.x, pixel.y-1)) {
							movePixel(pixelMap[pixel.x][pixel.y-2], pixel.x, pixel.y-1);
						}
						else {
							swapPixels(pixelMap[pixel.x][pixel.y-2], pixelMap[pixel.x][pixel.y-1]);
						}
					}
				}
			}
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
				}
				return
			}

			// Find the head
			if (!isEmpty(pixel.x, pixel.y-1, true) && pixelMap[pixel.x][pixel.y-1].element == "creeper_head") {
				var head = pixelMap[pixel.x][pixel.y-1];
				if (head.dead) { // If head is dead, kill body
					pixel.dead = head.dead;
				}
			}
			else { var head = null }

			if (isEmpty(pixel.x, pixel.y-1)) {
				// create blood if decapitated 10% chance
				if (Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y-1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			else if (head == null) { return }
			else if (Math.random() < 0.1) { // Move 10% chance
				var movesToTry = [
					[1*pixel.dir,0],
					[1*pixel.dir,-1],
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
						if (tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
							movePixel(head, head.x+move[0], head.y+move[1]);
							break;
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!head.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};

			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(head) {
				if(typeof(head.charge) !== "undefined") {
					if(head.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(head.charged) !== "undefined") {
					if(head.charged) {
						pixel.charged = true;
					};
				};
			};

			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 7;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 5;
			};
			
			if(pixel.burning) {
				pixel.hissing = true;
				if(!pixel.hissStart) {
					pixel.hissStart = pixelTicks;
				};
				if(!pixel.burnStart) { //I don't like errors.
					pixel.burnStart = pixel.ticks;
				};
				if(pixelTicks - pixel.burnStart > 30) {
					//console.log("Kaboom?");
					explodeAt(pixel.x,pixel.y,explosionRadius);
					//console.log("Yes, Rico, kaboom.");
				};
			};

			//Head hissing color handler: keeps track of head's hissing for coloring purposes
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.dead || !head || head.dead) { //can't hiss without a head according to the classic creeper anatomy
					//console.log("ss-- oof");
					pixel.hissing = false;
					break;
				};
				if(head.hissing) {
					//console.log("Ssssssss");
					if(!head.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						head.hissStart = pixelTicks;
					};

					//Color code {
						var ticksHissing = pixelTicks - head.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							//console.log("the j");
							luminance = slBound(luminance + 1.176);
							//console.log(luminance);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}
				};
			};
		},
	};

	elements.creeper_head = {
		color: ["#5B8B59", "#3F8738", "#559552", "#479143", "#50B143", "#58C546"],
		category: "life",
		hidden: true,
		density: 1080,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "cooked_meat",
		tempLow: -30,
		stateLow: "frozen_meat",
		burn: 10,
		burnTime: 250,
		burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","gunpowder"],
		breakInto: "blood",
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.05 },
			"oxygen": { "elem2":"carbon_dioxide", "chance":0.5 },
		},
		properties: {
			dead: false,
			following: false,
			hissing: false,
			charged: false,
			didChargeBlueTinted: false,
		},
		movable: true,
		tick: function(pixel) {
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
					return
				}
			}

			// Find the body
			if (!isEmpty(pixel.x, pixel.y+1, true) && pixelMap[pixel.x][pixel.y+1].element == "creeper_body") {
				var body = pixelMap[pixel.x][pixel.y+1];
				if (body.dead) { // If body is dead, kill head
					pixel.dead = body.dead;
				}
			}
			else { var body = null }

			if(body) {
				if(body.dir !== pixel.dir) { //hacky workaround: lock head dir to body dir
					pixel.dir = body.dir;
				};
			};

			if (isEmpty(pixel.x, pixel.y+1)) {
				tryMove(pixel, pixel.x, pixel.y+1);
				// create blood if severed 10% chance
				if (isEmpty(pixel.x, pixel.y+1) && !pixel.dead && Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y+1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			
			//start of most new code
			var pX = pixel.x;
			var pY = pixel.y;
			
			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(body) {
				if(typeof(body.charge) !== "undefined") {
					if(body.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(body.charged) !== "undefined") {
					if(body.charged) {
						pixel.charged = true;
					};
				};
			};
			
			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 10;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 7;
			};
			
			//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
			var directionAdverb = "left";
			if(pixel.dir > 0) {
				directionAdverb = "right";
			};
			//console.log(`Looking ${directionAdverb}`)
			if(pixel.dir === -1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = (-1); j > (-16 - 1); j--) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							//console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) { //probably misapplying the tolerance from the MC Wiki line: "Creepers will chase after any player, as long as it is within a 16 block (±5%) radius"
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break; //can't see through humans
							};
						};
					};
				};
			} else if(pixel.dir === 1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = 1; j < 16 + 1; j++) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							//console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) {
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
									break;
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break;
							};
						};
					};
				};
			};
			
			//Pre-explosion handler: keeps track of time before the kaboom
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.hissing) {
					//console.log("Ssssssss");
					if(pixel.dead || !body || body.dead) { //can't explode without a body according to the classic creeper anatomy
						//console.log("ss-- oof");
						pixel.hissing = false;
						break;
					};
					if(!pixel.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						pixel.hissStart = pixelTicks;
					};
					//Color code {
						var ticksHissing = pixelTicks - pixel.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							luminance = slBound(luminance + 1.176);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}

					if(pixelTicks - pixel.hissStart > 30) {
						//console.log("Kaboom?");
						//console.log(`Exploding with radius ${explosionRadius} (charged: ${pixel.charged})`);
						explodeAt(body.x,body.y,explosionRadius);
						//console.log("Yes, Rico, kaboom.");
					};
				};
			};
			
			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};
		},
	};

	/*End Main Creeper
		##################
		##################
		##################
		#########X#X######
		#########XXX######
		##########X#######
		##########X#######
		### # # # X # ####
		###           ####
		####          ####
		######        ####
		#######  ###  ####
		#######  ###  ####
		##################
	*/

															//Baby Creeper

	elements.baby_creeper = {
		color: ["#D2D2D2", "#BFDFB9", "#94CE89", "#78D965", "#5ED54C", "#58C546", "#50B143", "#479143", "#559552", "#3F8738", "#5B8B59"],
		category: "life",
		density: 1500,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "cooked_meat",
		tempLow: -30,
		stateLow: "frozen_meat",
		burn: 10,
		burnTime: 250,
		burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","gunpowder"],
		breakInto: ["blood","gunpowder"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.05 },
		},
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			charged: false,
			didChargeBlueTinted: false,
		},
		movable: true,
		tick: function(pixel) {
			tryMove(pixel, pixel.x, pixel.y+1); // Fall
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
				}
				return
			}

			if (Math.random() < 0.15) { // Move 15% chance (should be 12.5 but 15 looks better)
				var movesToTry = [
					[1*pixel.dir,0],	//dash move
					[1*pixel.dir,-1],	//slash move
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
						if(tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
							break;
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!pixel.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};

			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charge) {
				pixel.charged = true;
			};
			
			var pX = pixel.x;
			var pY = pixel.y;

			if(pixel.charged) {
				var explosionRadius = 6;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 4; //should be half of the original creeper's radius
			};
			
			if(pixel.burning) {
				pixel.hissing = true;
				if(!pixel.hissStart) {
					pixel.hissStart = pixelTicks;
				};
				if(!pixel.burnStart) { //I don't like errors.
					pixel.burnStart = pixel.ticks;
				};
				if(pixelTicks - pixel.burnStart > 15) {
					//console.log("Kaboom?");
					explodeAt(pixel.x,pixel.y,explosionRadius);
					//console.log("Yes, Rico, kaboom.");
				};
			};

			//Pre-explosion handler: keeps track of time before the kaboom
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.hissing) {
					//console.log("Ssssssss");
					if(pixel.dead) {
						//console.log("ss-- oof");
						pixel.hissing = false;
						break;
					};
					if(!pixel.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						pixel.hissStart = pixelTicks;
					};
					//Color code {
						var ticksHissing = pixelTicks - pixel.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + (2 * ticksHissing));
							green = rgbColorBound(green + (2 * ticksHissing));
							blue = rgbColorBound(blue + (2 * ticksHissing));
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							luminance = slBound(luminance + (2 * 1.176));
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}

					if(pixelTicks - pixel.hissStart > 15) {
						//console.log("Kaboom?");
						//console.log(`Exploding with radius ${explosionRadius} (charged: ${pixel.charged})`);
						explodeAt(pixel.x,pixel.y,explosionRadius);
						//console.log("Yes, Rico, kaboom.");
					};
				};
			};
			
			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};

			//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
			var directionAdverb = "left";
			if(pixel.dir > 0) {
				directionAdverb = "right";
			};
			//console.log(`Looking ${directionAdverb}`)
			if(pixel.dir === -1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = (-1); j > (-16 - 1); j--) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							//console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) { //probably misapplying the tolerance from the MC Wiki line: "Creepers will chase after any player, as long as it is within a 16 block (±5%) radius"
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break; //can't see through humans
							};
						};
					};
				};
			} else if(pixel.dir === 1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = 1; j < 16 + 1; j++) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							//console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) {
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
									break;
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break;
							};
						};
					};
				};
			};
		},
		related: ["creeper"],
	};

															//Angelic Creeper

	elements.angelic_creeper = { //let's get this one out of the way first
		color: ["#f5ef56", "#fcbddf", "#de8aa8", "#e35d95", "#eb4974", "#ed3ea7", "#d645a3", "#a84556", "#9e4f6c", "#91315b", "#8c4963"],
		category: "life",
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			following: false,
		},
		movable: true,
		tick: function(pixel) {
			if (isEmpty(pixel.x, pixel.y+1)) {
				createPixel("angelic_creeper_body", pixel.x, pixel.y+1);
				pixel.element = "angelic_creeper_head";
				pixel.color = pixelColorPick(pixel)
			}
			else if (isEmpty(pixel.x, pixel.y-1)) {
				createPixel("angelic_creeper_head", pixel.x, pixel.y-1);
				pixelMap[pixel.x][pixel.y-1].color = pixel.color;
				pixel.element = "angelic_creeper_body";
				pixel.color = pixelColorPick(pixel)
			}
			else {
				deletePixel(pixel.x, pixel.y);
			}
		},
		related: ["angelic_creeper_body","angelic_creeper_head"],
		desc: 'A creeper type from <em>Extra Creeper Types</em> <a href="https://www.curseforge.com/minecraft/mc-mods/extra-creeper-types">(CF)</a>. It sends things upward.'
	};

	elements.angelic_creeper_body = {
		color: ["#d2d2d2", "#fcbddf", "#de8aa8", "#e35d95", "#eb4974", "#ed3ea7", "#d645a3", "#a84556", "#9e4f6c", "#91315b", "#8c4963"],
		category: "life",
		hidden: true,
		density: 1500,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "cooked_meat",
		tempLow: -30,
		stateLow: "frozen_meat",
		burn: 10,
		burnTime: 250,
		burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","gunpowder"],
		breakInto: ["blood","blood","gunpowder","gunpowder","feather"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.05 },
		},
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			charged: false,
			didChargeBlueTinted: false,
		},
		movable: true,
		tick: function(pixel) {
			if(!pixel.hissing) { //If not hissing (it floats when hissing)
				if(Math.random() < 0.2) { //20% chance to fall
					if (tryMove(pixel, pixel.x, pixel.y+1)) { // Fall
						if (!isEmpty(pixel.x, pixel.y-2, true)) { // Drag head down
							var headPixel = pixelMap[pixel.x][pixel.y-2];
							if (headPixel.element == "angelic_creeper_head") {
								if (isEmpty(pixel.x, pixel.y-1)) {
									movePixel(pixelMap[pixel.x][pixel.y-2], pixel.x, pixel.y-1);
								} else {
									swapPixels(pixelMap[pixel.x][pixel.y-2], pixelMap[pixel.x][pixel.y-1]);
								};
							};
						};
					};
				};
			} else {
				if((pixelTicks - pixel.start) % 3 == 0) {
					if (!isEmpty(pixel.x, pixel.y-1, true)) { // Find head
						var headPixel = pixelMap[pixel.x][pixel.y-1];
						if (headPixel.element == "angelic_creeper_head") { //Validate head
							if (tryMove(headPixel, pixel.x, pixel.y-2)) { // Float
								if (isEmpty(pixel.x, pixel.y-1)) { //If the head didn't swap with something
									movePixel(pixel, pixel.x, pixel.y-1); //Pull body up
								} else { //If it did swap
									swapPixels(pixel, pixelMap[pixel.x][pixel.y-1]); //Pull body up through other pixel
								};
							};
						};
					};
				};
			};
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
				}
				return
			}

			// Find the head
			if (!isEmpty(pixel.x, pixel.y-1, true) && pixelMap[pixel.x][pixel.y-1].element == "angelic_creeper_head") {
				var head = pixelMap[pixel.x][pixel.y-1];
				if (head.dead) { // If head is dead, kill body
					pixel.dead = head.dead;
				}
			}
			else { var head = null }

			if (isEmpty(pixel.x, pixel.y-1)) {
				// create blood if decapitated 10% chance
				if (Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y-1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			else if (head == null) { return }
			else if (Math.random() < 0.1) { // Move 10% chance
				var movesToTry = [
					[1*pixel.dir,0],
					[1*pixel.dir,-1],
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
						if (tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
							movePixel(head, head.x+move[0], head.y+move[1]);
							break;
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!head.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};

			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(head) {
				if(typeof(head.charge) !== "undefined") {
					if(head.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(head.charged) !== "undefined") {
					if(head.charged) {
						pixel.charged = true;
					};
				};
			};

			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 10;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 7;
			};
			
			if(pixel.burning) {
				pixel.hissing = true;
				if(!pixel.hissStart) {
					pixel.hissStart = pixelTicks;
				};
				if(!pixel.burnStart) { //I don't like errors.
					pixel.burnStart = pixel.ticks;
				};
				if(pixelTicks - pixel.burnStart > 30) {
					//console.log("GOTTA YEET YEET YEET!");
					explodeAtPlus(pixel.x,pixel.y,explosionRadius,"fire","smoke",null,angelicUpwardVelocity);	//Special effect: Flings you upwards (extended to all movable tiles because it's easier).
																									//It also floats when hissing, but that will come soon.
					//console.log("Yes, Rico, kaboom.");
				};
			};

			//Head hissing color handler: keeps track of head's hissing for coloring purposes
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.dead || !head || head.dead) { //can't hiss without a head according to the classic creeper anatomy
					//console.log("ss-- oof");
					pixel.hissing = false;
					break;
				};
				if(head.hissing) {
					//console.log("Ssssssss");
					if(!head.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						head.hissStart = pixelTicks;
					};

					//Color code {
						var ticksHissing = pixelTicks - head.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							//console.log("the j");
							luminance = slBound(luminance + 1.176);
							//console.log(luminance);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}
				};
			};
		},
	},
	elements.angelic_creeper_head = {
		color: ["#f5ef56", "#f0ea4f", "#f0ea60"],
		category: "life",
		hidden: true,
		density: 1080,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "cooked_meat",
		tempLow: -30,
		stateLow: "frozen_meat",
		burn: 10,
		burnTime: 250,
		burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","gunpowder"],
		breakInto: ["blood","blood","blood","blood","feather"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.05 },
			"oxygen": { "elem2":"carbon_dioxide", "chance":0.5 },
		},
		properties: {
			dead: false,
			following: false,
			hissing: false,
			charged: false,
			didChargeBlueTinted: false,
		},
		movable: true,
		tick: function(pixel) {
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
					return
				}
			}

			// Find the body
			if (!isEmpty(pixel.x, pixel.y+1, true) && pixelMap[pixel.x][pixel.y+1].element == "angelic_creeper_body") {
				var body = pixelMap[pixel.x][pixel.y+1];
				if (body.dead) { // If body is dead, kill head
					pixel.dead = body.dead;
				}
			}
			else { var body = null }

			if(body) {
				if(body.dir !== pixel.dir) { //hacky workaround: lock head dir to body dir
					pixel.dir = body.dir;
				};
			};

			if (isEmpty(pixel.x, pixel.y+1)) {
				tryMove(pixel, pixel.x, pixel.y+1);
				// create blood if severed 10% chance
				if (isEmpty(pixel.x, pixel.y+1) && !pixel.dead && Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y+1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			
			//start of most new code
			var pX = pixel.x;
			var pY = pixel.y;
			
			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(body) {
				if(typeof(body.charge) !== "undefined") {
					if(body.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(body.charged) !== "undefined") {
					if(body.charged) {
						pixel.charged = true;
					};
				};
			};
			
			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 10;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 7;
			};
			
			//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
			var directionAdverb = "left";
			if(pixel.dir > 0) {
				directionAdverb = "right";
			};
			//console.log(`Looking ${directionAdverb}`)
			if(pixel.dir === -1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = (-1); j > (-16 - 1); j--) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) { //probably misapplying the tolerance from the MC Wiki line: "Creepers will chase after any player, as long as it is within a 16 block (±5%) radius"
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break; //can't see through humans
							};
						};
					};
				};
			} else if(pixel.dir === 1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = 1; j < 16 + 1; j++) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) {
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
									break;
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break;
							};
						};
					};
				};
			};
			
			//Pre-explosion handler: keeps track of time before the kaboom
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.hissing) {
					//console.log("Ssssssss");
					if(pixel.dead || !body || body.dead) { //can't explode without a body according to the classic creeper anatomy
						//console.log("ss-- oof");
						pixel.hissing = false;
						break;
					};
					if(!pixel.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						pixel.hissStart = pixelTicks;
					};
					//Color code {
						var ticksHissing = pixelTicks - pixel.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							luminance = slBound(luminance + 1.176);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}

					if(pixelTicks - pixel.hissStart > 30) {
						//console.log("GOTTA YEET YEET YEET!");
						//console.log(`Exploding with radius ${explosionRadius} (charged: ${pixel.charged})`);
						explodeAtPlus(body.x,body.y,explosionRadius,"fire","smoke",null,angelicUpwardVelocity);
						//console.log("Yes, Rico, kaboom.");
					};
				};
			};
			
			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};
		},
	};

																//Bombing Creeper

	elements.bombing_creeper = {
		color: ["#5b8b59", "#3f8738", "#559552", "#479143", "#50b143", "#58c546", "#e83c3c", "#c92a2a", "#f53d3d", "#ad3131"],
		category: "life",
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			following: false,
		},
		movable: true,
		tick: function(pixel) {
			if (isEmpty(pixel.x, pixel.y+1)) {
				createPixel("bombing_creeper_body", pixel.x, pixel.y+1);
				pixel.element = "bombing_creeper_head";
				pixel.color = pixelColorPick(pixel)
			}
			else if (isEmpty(pixel.x, pixel.y-1)) {
				createPixel("bombing_creeper_head", pixel.x, pixel.y-1);
				pixelMap[pixel.x][pixel.y-1].color = pixel.color;
				pixel.element = "bombing_creeper_body";
				pixel.color = pixelColorPick(pixel)
			}
			else {
				deletePixel(pixel.x, pixel.y);
			}
		},
		related: ["bombing_creeper_body","bombing_creeper_head"],
		desc: 'A creeper type from <em>Extra Creeper Types</em> <a href="https://www.curseforge.com/minecraft/mc-mods/extra-creeper-types">(CF)</a>. It spawns more explosives when it explodes.'
	};

	elements.bombing_creeper_body = {
		color: ["#e83c3c", "#c92a2a", "#f53d3d", "#ad3131"],
		category: "life",
		hidden: true,
		density: 1500,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "cooked_meat",
		tempLow: -30,
		stateLow: "frozen_meat",
		burn: 10,
		burnTime: 250,
		burnInto: ["cooked_meat","cooked_meat","cooked_meat","dynamite","gunpowder"],
		breakInto: ["blood","dynamite","dynamite"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.05 },
		},
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			charged: false,
			didChargeBlueTinted: false,
		},
		movable: true,
		tick: function(pixel) {
			if (tryMove(pixel, pixel.x, pixel.y+1)) { // Fall
				if (!isEmpty(pixel.x, pixel.y-2, true)) { // Drag head down
					var headPixel = pixelMap[pixel.x][pixel.y-2];
					if (headPixel.element == "bombing_creeper_head") {
						if (isEmpty(pixel.x, pixel.y-1)) {
							movePixel(pixelMap[pixel.x][pixel.y-2], pixel.x, pixel.y-1);
						}
						else {
							swapPixels(pixelMap[pixel.x][pixel.y-2], pixelMap[pixel.x][pixel.y-1]);
						}
					}
				}
			}
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
				}
				return
			}

			// Find the head
			if (!isEmpty(pixel.x, pixel.y-1, true) && pixelMap[pixel.x][pixel.y-1].element == "bombing_creeper_head") {
				var head = pixelMap[pixel.x][pixel.y-1];
				if (head.dead) { // If head is dead, kill body
					pixel.dead = head.dead;
				}
			}
			else { var head = null }

			if (isEmpty(pixel.x, pixel.y-1)) {
				// create blood if decapitated 10% chance
				if (Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y-1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			else if (head == null) { return }
			else if (Math.random() < 0.1) { // Move 10% chance
				var movesToTry = [
					[1*pixel.dir,0],
					[1*pixel.dir,-1],
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
						if (tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
							movePixel(head, head.x+move[0], head.y+move[1]);
							break;
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!head.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};

			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(head) {
				if(typeof(head.charge) !== "undefined") {
					if(head.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(head.charged) !== "undefined") {
					if(head.charged) {
						pixel.charged = true;
					};
				};
			};

			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 10;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 7;
			};
			
			if(pixel.burning) {
				pixel.hissing = true;
				if(!pixel.hissStart) {
					pixel.hissStart = pixelTicks;
				};
				if(!pixel.burnStart) { //I don't like errors.
					pixel.burnStart = pixel.ticks;
				};
				if(pixelTicks - pixel.burnStart > 30) {
					//console.log("Kaboom?");
					explodeAt(pixel.x,pixel.y,explosionRadius,"fire,dynamite");	//Effect: Places (originally 5) primed TNT when it explodes (i.e. cluster bomb creeper)
																				//Dynamite is the closest thing we have to powder TNT (i.e. good enough)
					//console.log("Yes, Rico, kaboom.");
				};
			};

			//Head hissing color handler: keeps track of head's hissing for coloring purposes
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.dead || !head || head.dead) { //can't hiss without a head according to the classic creeper anatomy
					//console.log("ss-- oof");
					pixel.hissing = false;
					break;
				};
				if(head.hissing) {
					//console.log("Ssssssss");
					if(!head.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						head.hissStart = pixelTicks;
					};

					//Color code {
						var ticksHissing = pixelTicks - head.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							//console.log("the j");
							luminance = slBound(luminance + 1.176);
							//console.log(luminance);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}
				};
			};
		},
	};

	elements.bombing_creeper_head = {
		color: ["#5B8B59", "#3F8738", "#559552", "#479143", "#50B143", "#58C546"],
		category: "life",
		hidden: true,
		density: 1080,
		state: "solid",
		conduct: 25,
		tempHigh: 250,
		stateHigh: "cooked_meat",
		tempLow: -30,
		stateLow: "frozen_meat",
		burn: 10,
		burnTime: 250,
		burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","dynamite","gunpowder"],
		breakInto: ["blood","dynamite"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.05 },
			"oxygen": { "elem2":"carbon_dioxide", "chance":0.5 },
		},
		properties: {
			dead: false,
			following: false,
			hissing: false,
			charged: false,
			didChargeBlueTinted: false,
		},
		movable: true,
		tick: function(pixel) {
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
					return
				}
			}

			// Find the body
			if (!isEmpty(pixel.x, pixel.y+1, true) && pixelMap[pixel.x][pixel.y+1].element == "bombing_creeper_body") {
				var body = pixelMap[pixel.x][pixel.y+1];
				if (body.dead) { // If body is dead, kill head
					pixel.dead = body.dead;
				}
			}
			else { var body = null }

			if(body) {
				if(body.dir !== pixel.dir) { //hacky workaround: lock head dir to body dir
					pixel.dir = body.dir;
				};
			};

			if (isEmpty(pixel.x, pixel.y+1)) {
				tryMove(pixel, pixel.x, pixel.y+1);
				// create blood if severed 10% chance
				if (isEmpty(pixel.x, pixel.y+1) && !pixel.dead && Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y+1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			
			//start of most new code
			var pX = pixel.x;
			var pY = pixel.y;
			
			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(body) {
				if(typeof(body.charge) !== "undefined") {
					if(body.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(body.charged) !== "undefined") {
					if(body.charged) {
						pixel.charged = true;
					};
				};
			};
			
			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 10;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 7;
			};
			
			//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
			var directionAdverb = "left";
			if(pixel.dir > 0) {
				directionAdverb = "right";
			};
			//console.log(`Looking ${directionAdverb}`)
			if(pixel.dir === -1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = (-1); j > (-16 - 1); j--) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) { //probably misapplying the tolerance from the MC Wiki line: "Creepers will chase after any player, as long as it is within a 16 block (±5%) radius"
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break; //can't see through humans
							};
						};
					};
				};
			} else if(pixel.dir === 1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = 1; j < 16 + 1; j++) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) {
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
									break;
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break;
							};
						};
					};
				};
			};
			
			//Pre-explosion handler: keeps track of time before the kaboom
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.hissing) {
					//console.log("Ssssssss");
					if(pixel.dead || !body || body.dead) { //can't explode without a body according to the classic creeper anatomy
						//console.log("ss-- oof");
						pixel.hissing = false;
						break;
					};
					if(!pixel.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						pixel.hissStart = pixelTicks;
					};
					//Color code {
						var ticksHissing = pixelTicks - pixel.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							luminance = slBound(luminance + 1.176);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}

					if(pixelTicks - pixel.hissStart > 30) {
						//console.log("Kaboom?");
						//console.log(`Exploding with radius ${explosionRadius} (charged: ${pixel.charged})`);
						explodeAt(body.x,body.y,explosionRadius,"fire,dynamite");
						//console.log("Yes, Rico, kaboom.");
					};
				};
			};
			
			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};
		},
	};

																//Hell Creeper

	elements.hell_creeper = {
		color: ["#D2D2D2", "#ff141e", "#fc3232", "#DFAFAF", "#e84a4a", "#ce7979", "#d95555", "#d53c3c", "#c53636", "#b13333", "#913535", "#954242", "#872828", "#8b4949", "#2b0304"],
		category: "life",
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			following: false,
		},
		movable: true,
		tick: function(pixel) {
			if (isEmpty(pixel.x, pixel.y+1)) {
				createPixel("hell_creeper_body", pixel.x, pixel.y+1);
				pixel.element = "hell_creeper_head";
				pixel.color = pixelColorPick(pixel)
			}
			else if (isEmpty(pixel.x, pixel.y-1)) {
				createPixel("hell_creeper_head", pixel.x, pixel.y-1);
				pixelMap[pixel.x][pixel.y-1].color = pixel.color;
				pixel.element = "hell_creeper_body";
				pixel.color = pixelColorPick(pixel)
			}
			else {
				deletePixel(pixel.x, pixel.y);
			}
		},
		related: ["hell_creeper_body","hell_creeper_head"],
		desc: 'A creeper type from <em>Extra Creeper Types</em> <a href="https://www.curseforge.com/minecraft/mc-mods/extra-creeper-types">(CF)</a>. It has a small explosion radius, but spawns a lot of fire around its explosion.'
	};

	elements.hell_creeper_body = {
		color: ["#D2D2D2", "#ff141e", "#fc3232", "#DFAFAF", "#e84a4a", "#ce7979", "#d95555", "#d53c3c", "#c53636", "#b13333", "#913535", "#954242", "#872828", "#8b4949", "#2b0304"],
		category: "life",
		hidden: true,
		density: 1500,
		state: "solid",
		conduct: 25,
		tempHigh: 2000, //they are immune to lava, and minecraft's lava is presumably mafic, so at least 1200*C
		stateHigh: "ash",
		breakInto: ["blood","gunpowder","fire"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.05 },
		},
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			charged: false,
			didChargeBlueTinted: false,
		},
		movable: true,
		tick: function(pixel) {
			if (tryMove(pixel, pixel.x, pixel.y+1)) { // Fall
				if (!isEmpty(pixel.x, pixel.y-2, true)) { // Drag head down
					var headPixel = pixelMap[pixel.x][pixel.y-2];
					if (headPixel.element == "hell_creeper_head") {
						if (isEmpty(pixel.x, pixel.y-1)) {
							movePixel(pixelMap[pixel.x][pixel.y-2], pixel.x, pixel.y-1);
						}
						else {
							swapPixels(pixelMap[pixel.x][pixel.y-2], pixelMap[pixel.x][pixel.y-1]);
						}
					}
				}
			}
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
				}
				return
			}

			// Find the head
			if (!isEmpty(pixel.x, pixel.y-1, true) && pixelMap[pixel.x][pixel.y-1].element == "hell_creeper_head") {
				var head = pixelMap[pixel.x][pixel.y-1];
				if (head.dead) { // If head is dead, kill body
					pixel.dead = head.dead;
				}
			}
			else { var head = null }

			if (isEmpty(pixel.x, pixel.y-1)) {
				// create blood if decapitated 10% chance
				if (Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y-1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			else if (head == null) { return }
			else if (Math.random() < 0.1) { // Move 10% chance
				var movesToTry = [
					[1*pixel.dir,0],
					[1*pixel.dir,-1],
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
						if (tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
							movePixel(head, head.x+move[0], head.y+move[1]);
							break;
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!head.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};

			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(head) {
				if(typeof(head.charge) !== "undefined") {
					if(head.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(head.charged) !== "undefined") {
					if(head.charged) {
						pixel.charged = true;
					};
				};
			};

			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 10;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 7;
			};
			
			if(pixel.burning) {
				pixel.hissing = true;
				if(!pixel.hissStart) {
					pixel.hissStart = pixelTicks;
				};
				if(!pixel.burnStart) { //I don't like errors.
					pixel.burnStart = pixel.ticks;
				};
				if(pixelTicks - pixel.burnStart > 30) {
					//console.log("Kaboom?");
					explodeAtPlus(pixel.x,pixel.y,explosionRadius,"fire","fire",null,hellExplosionFire);
					//console.log("Yes, Rico, kaboom.");
				};
			};

			//Head hissing color handler: keeps track of head's hissing for coloring purposes
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.dead || !head || head.dead) { //can't hiss without a head according to the classic creeper anatomy
					//console.log("ss-- oof");
					pixel.hissing = false;
					break;
				};
				if(head.hissing) {
					//console.log("Ssssssss");
					if(!head.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						head.hissStart = pixelTicks;
					};

					//Color code {
						var ticksHissing = pixelTicks - head.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							//console.log("the j");
							luminance = slBound(luminance + 1.176);
							//console.log(luminance);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}
				};
			};
		},
	};

	elements.hell_creeper_head = {
		color: ["#D2D2D2", "#ff141e", "#fc3232", "#e84a4a", "#b13333", "#913535", "#954242", "#872828", "#8b4949", "#2b0304", "#111111", "#faae3c", "#f5e131"],
		category: "life",
		hidden: true,
		density: 1080,
		state: "solid",
		conduct: 25,
		tempHigh: 2000,
		stateHigh: "ash",
		tempLow: -30,
		stateLow: "frozen_meat",
		breakInto: ["blood","fire"],
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.005 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
			"plague": { "elem1":"plague", "chance":0.05 },
			"oxygen": { "elem2":"carbon_dioxide", "chance":0.5 },
		},
		properties: {
			dead: false,
			following: false,
			hissing: false,
			charged: false,
			didChargeBlueTinted: false,
		},
		movable: true,
		tick: function(pixel) {
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
					return
				}
			}

			// Find the body
			if (!isEmpty(pixel.x, pixel.y+1, true) && pixelMap[pixel.x][pixel.y+1].element == "hell_creeper_body") {
				var body = pixelMap[pixel.x][pixel.y+1];
				if (body.dead) { // If body is dead, kill head
					pixel.dead = body.dead;
				}
			}
			else { var body = null }

			if(body) {
				if(body.dir !== pixel.dir) { //hacky workaround: lock head dir to body dir
					pixel.dir = body.dir;
				};
			};

			if (isEmpty(pixel.x, pixel.y+1)) {
				tryMove(pixel, pixel.x, pixel.y+1);
				// create blood if severed 10% chance
				if (isEmpty(pixel.x, pixel.y+1) && !pixel.dead && Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y+1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			
			//start of most new code
			var pX = pixel.x;
			var pY = pixel.y;
			
			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(body) {
				if(typeof(body.charge) !== "undefined") {
					if(body.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(body.charged) !== "undefined") {
					if(body.charged) {
						pixel.charged = true;
					};
				};
			};
			
			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 10;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 7;
			};
			
			//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
			var directionAdverb = "left";
			if(pixel.dir > 0) {
				directionAdverb = "right";
			};
			//console.log(`Looking ${directionAdverb}`)
			if(pixel.dir === -1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = (-1); j > (-16 - 1); j--) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) { //probably misapplying the tolerance from the MC Wiki line: "Creepers will chase after any player, as long as it is within a 16 block (±5%) radius"
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break; //can't see through humans
							};
						};
					};
				};
			} else if(pixel.dir === 1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = 1; j < 16 + 1; j++) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) {
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
									break;
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break;
							};
						};
					};
				};
			};
			
			//Pre-explosion handler: keeps track of time before the kaboom
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.hissing) {
					//console.log("Ssssssss");
					if(pixel.dead || !body || body.dead) { //can't explode without a body according to the classic creeper anatomy
						//console.log("ss-- oof");
						pixel.hissing = false;
						break;
					};
					if(!pixel.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						pixel.hissStart = pixelTicks;
					};
					//Color code {
						var ticksHissing = pixelTicks - pixel.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							luminance = slBound(luminance + 1.176);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}

					if(pixelTicks - pixel.hissStart > 30) {
						//console.log("Kaboom?");
						//console.log(`Exploding with radius ${explosionRadius} (charged: ${pixel.charged})`);
						explodeAtPlus(pixel.x,pixel.y,explosionRadius,"fire","fire",null,hellExplosionFire);
						//console.log("Yes, Rico, kaboom.");
					};
				};
			};
			
			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};
		},
	};

	/* +-----------------------------------+
	   | Nothing There                     |
	   |                                   |
	   | amogus                            |
	   |                                   |
	   | red imposter                      |
	   |                                   |
	   |                                   |
	   |                                   |
	   |                                   |
	   |                                   |
	   |                                   |
	   |                                   |
	   +-----------------------------------+ */

	elements.nothing_there_bullet = {
		flippableX: true,
		movable: true,
		density: 10000,
		desc: "A hypersonic bullet made of Nothing There's flesh. I don't remember if it can turn humans into red clouds.",
		color: "#a3281a",
		related: ["nothing_there_phase_3_body","nothing_there_phase_3_head"],
		movable: true,
		tick: function(pixel) {
			if(typeof(pixel.flipX) == undefined) {
				pixel.flipX = !!Math.floor(Math.random() * 2);
			};
			var dir = pixel.flipX ? -1 : 1;
			for(i = 0; i < 6; i++) {
				if(outOfBounds(pixel.x+dir,pixel.y)) {
					deletePixel(pixel.x,pixel.y);
					break;
				};
				if(!nothingThereBulletMovement(pixel,pixel.x+dir,pixel.y)) {
					return true;
				};
			};
		},
	};

	elements.nothing_there_mace = {
		movable: true,
		density: 10000,
		desc: "A spiky mace attached to Nothing There, which can turn humans into red clouds.",
		color: "#fa4632",
		properties: {
			counter: 2,
		},
		related: ["nothing_there_phase_3_body","nothing_there_phase_3_head"],
		movable: true,
		tick: function(pixel) {
			if(outOfBounds(pixel.x,pixel.y + 1)) {
				deletePixel(pixel.x,pixel.y);
				return false;
			};
			if(!tryMove(pixel,pixel.x,pixel.y + 1)) {
				var newPixel = pixelMap[pixel.x][pixel.y + 1];
				var newElement = newPixel.element;
				var newInfo = elements[newElement];
				if(newElement !== pixel.element) {
					if(newInfo.state === "gas") {
						swapPixels(pixel,newPixel);
					} else {
						if(pixel.counter > 0) {
							explodeAtPlus(pixel.x,pixel.y + 1,5,null,null);
							pixel.counter--;
						} else {
							deletePixel(pixel.x,pixel.y);
							return true;
						};
					};
				};
			};
		},
	};

	elements.nothing_there_cleaver = {
		movable: true,
		density: 10000,
		desc: "A very sharp blade attached to Nothing There, which can turn humans into red clouds.",
		color: "#a33c3c",
		properties: {
			counter: 4,
		},
		related: ["nothing_there_phase_3_body","nothing_there_phase_3_head"],
		movable: true,
		tick: function(pixel) {
			if(outOfBounds(pixel.x,pixel.y + 1)) {
				deletePixel(pixel.x,pixel.y);
				return false;
			};
			if(!tryMove(pixel,pixel.x,pixel.y + 1)) {
				var newPixel = pixelMap[pixel.x][pixel.y + 1];
				var newElement = newPixel.element;
				var newInfo = elements[newElement];
				if(!nothingThereBulletExcludedElements.includes(newElement)) {
					if(pixel.counter > 0) {
						swapPixels(pixel,newPixel);
						breakPixel(newPixel,false,false);
						pixel.counter--;
					} else {
						deletePixel(pixel.x,pixel.y);
						return true;
					};
				} else {
					deletePixel(pixel.x,pixel.y);
					return false;
				};
			};
		},
	};

	testSwapArray = ["meat","cooked_meat","rotten_meat","blood","infection","antibody","plague","zombie_blood","frozen_meat","frozen_rotten_meat"];

	elements.nothing_there_phase_1 = {
		color: "#faacac",
		category: "life",
		density: 2000,
		desc: "O-06-20 <span style='color: red;'>(ALEPH)</span><br/>In this phase, it looks like a dog made of misshapen human parts. It can easily turn humans into unrecognizable messes.",
		state: "solid",
		tempHigh: 3000,
		hardness: 0.995,
		stateHigh: "cooked_meat",
		burn: 1,
		burnTime: 250000,
		burnInto: "cooked_meat",
		breakInto: (enabledMods.includes("mods/fey_and_more.js") ? ["blood","meat","magic"] : ["blood","meat"]),
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.00002 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.00004 },
			"plague": { "elem1":"plague", "chance":0.000003 },
		},
		related: ["nothing_there_phase_2", "nothing_there_phase_3_body", "nothing_there_phase_3_head"],
		properties: {
			dead: false,
			dir: 1,
			following: false,
		},
		movable: true,
		tick: function(pixel) {
			var pixelBreakInto = elements[pixel.element].breakInto;
			tryMove(pixel, pixel.x, pixel.y+1); // Fall
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Break if pixelTicks-dead > 5
				if (pixelTicks-pixel.dead > 5) {
					changePixel(pixel,pixelBreakInto[Math.floor(Math.random() * pixelBreakInto.length)],false);
				};
				return;
			};

			if (Math.random() < 0.1) { // Move 10% chance
				var movesToTry = [
					[1*pixel.dir,0],	//dash move
					[1*pixel.dir,-1],	//cleave move
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if(tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
						break;
					} else { //move through given pixels
						if(!isEmpty(pixel.x+move[0], pixel.y+move[1], true)) {
							var blockingPixel = pixelMap[pixel.x+move[0]][pixel.y+move[1]];
							//console.log(blockingPixel);
							var blockingElement = blockingPixel.element;
							if(testSwapArray.includes(blockingElement)) {
								swapPixels(pixel,blockingPixel);
								break;
							};
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!pixel.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};

			var pX = pixel.x;
			var pY = pixel.y;

			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};

			//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
			if(pixelTicks % 2 == 0 && !pixel.dead) { //reduce rate for performance
				/*var directionAdverb = "left";
				if(pixel.dir > 0) {
					directionAdverb = "right";
				};*/
				//console.log(`Looking ${directionAdverb}`)
				if(pixel.dir === -1) {
					for(i = -4; i < 4+1; i++) {
						var oY = i;
						//console.log(`Starting row look at row ${pY+oY}`)
						for(j = (-1); j > (-35 - 1); j--) {
							var oX = j;
							var nX = pX+oX;
							var nY = pY+oY;
							if(outOfBounds(nX,nY)) {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
								break;
							};
							if(isEmpty(nX,nY)) {
								////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
								continue;
							};
							if(!isEmpty(nX,nY,true)) {
								var newPixel = pixelMap[nX][nY];
								var newElement = newPixel.element;
								if(enemyHumanoidArray.includes(newElement)) {
									//console.log(`Human part found at (${nX},${nY})`)
									if(!newPixel.dead) { //If not dead
										pixel.following = true;
										//console.log(`Human detected at (${nX},${nY})`)
										//Infect/kill if a human is close enough
										if(pyth(pX,pY,nX,nY) <= 1.5) { //approx. sqrt(2)
											if(Math.random() < 1/4) {	//One-fourth chance to change to blood
												changePixel(newPixel,"blood",false);
											} else {					//Remaining 3/4 chance to change to meat
												changePixel(newPixel,"meat",false);
											};
										};
									} else { //Mutilate if dead
										if(Math.random() < 1/4) {	//One-fourth chance to change to blood
											changePixel(newPixel,"blood",false);
										} else {					//Remaining 3/4 chance to change to meat
											changePixel(newPixel,"meat",false);
										};
									};
								} else {
									//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
									break; //can't see through humans
								};
							};
						};
					};
				} else if(pixel.dir === 1) {
					for(i = -4; i < 4+1; i++) {
						var oY = i;
						//console.log(`Starting row look at row ${pY+oY}`)
						for(j = 1; j < 35 + 1; j++) {
							var oX = j;
							var nX = pX+oX;
							var nY = pY+oY;
							if(outOfBounds(nX,nY)) {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
								break;
							};
							if(isEmpty(nX,nY)) {
								////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
								continue;
							};
							if(!isEmpty(nX,nY,true)) {
								var newPixel = pixelMap[nX][nY];
								var newElement = newPixel.element;
								if(enemyHumanoidArray.includes(newElement)) {
									//console.log(`Human part found at (${nX},${nY})`)
									if(!newPixel.dead) { //If not dead
										pixel.following = true;
										//console.log(`Human detected at (${nX},${nY})`)
										//Infect/kill if a human is close enough
										if(pyth(pX,pY,nX,nY) <= 1.5) { //approx. sqrt(2)
											if(Math.random() < 1/4) {	//One-fourth chance to change to blood
												changePixel(newPixel,"blood",false);
											} else {					//Remaining 3/4 chance to change to meat
												changePixel(newPixel,"meat",false);
											};
										};
									} else { //Mutilate if dead
										if(Math.random() < 1/4) {	//One-fourth chance to change to blood
											changePixel(newPixel,"blood",false);
										} else {					//Remaining 3/4 chance to change to meat
											changePixel(newPixel,"meat",false);
										};
									};
								} else {
									//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
									break; //can't see through humans
								};
							};
						};
					};
				};
			};

			if(pixelTicks - pixel.start > 300 && (Math.random() < 0.003)) {
				var dir = pixel.dir;
				changePixel(pixel,"nothing_there_phase_2",false);
				pixel.dir = dir;
			};

			//End
		},
	};

	elements.nothing_there_phase_2 = {
		behavior: behaviors.POWDER_OLD,
		color: "#d90b0b",
		category: "life",
		density: 4000,
		desc: "O-06-20 <span style='color: red;'>(ALEPH)</span><br/>In this phase, it looks like a red, fibrous cocoon. It will soon hatch into its third phase.",
		state: "solid",
		tempHigh: 3500,
		hardness: 0.999,
		stateHigh: "cooked_meat",
		burn: 1,
		burnTime: 350000,
		burnInto: "cooked_meat",
		breakInto: (enabledMods.includes("mods/fey_and_more.js") ? ["blood","meat","magic"] : ["blood","meat"]),
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.000001 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.000001 },
			"plague": { "elem1":"plague", "chance":0.000001 },
		},
		related: ["nothing_there_phase_1", "nothing_there_phase_3_body", "nothing_there_phase_3_head"],
		properties: {
			dead: false,
			dir: 1,
			timer: 0,
		},
		movable: true,
		tick: function(pixel) {
			var pixelBreakInto = elements[pixel.element].breakInto;
					doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Break if pixelTicks-dead > 5
				if (pixelTicks-pixel.dead > 5) {
					changePixel(pixel,pixelBreakInto[Math.floor(Math.random() * pixelBreakInto.length)],false);
				};
				return;
			};

			if(pixelTicks - pixel.start > 300) {
				var dir = pixel.dir;
				if (isEmpty(pixel.x, pixel.y+1)) {
					createPixel("nothing_there_phase_3_body", pixel.x, pixel.y+1);
					pixel.element = "nothing_there_phase_3_head";
					pixel.color = pixelColorPick(pixel)
					pixelMap[pixel.x][pixel.y+1].dir = dir;
				}
				else if (isEmpty(pixel.x, pixel.y-1)) {
					createPixel("nothing_there_phase_3_head", pixel.x, pixel.y-1);
					pixelMap[pixel.x][pixel.y-1].color = pixel.color;
					pixel.element = "nothing_there_phase_3_body";
					pixel.color = pixelColorPick(pixel)
					pixel.dir = dir;
				};
			};

			//End
		},
	};

	elements.nothing_there_phase_3 = {
		color: "#fc1e35",
		category: "life",
		desc: "Spawns Nothing There in its humanoid third phase, for when you don't want to wait for it to go through the other phases.",
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			following: false,
		},
		movable: true,
		tick: function(pixel) {
			if (isEmpty(pixel.x, pixel.y+1)) {
				createPixel("nothing_there_phase_3_body", pixel.x, pixel.y+1);
				pixel.element = "nothing_there_phase_3_head";
				pixel.color = pixelColorPick(pixel)
			} else if (isEmpty(pixel.x, pixel.y-1)) {
				createPixel("nothing_there_phase_3_head", pixel.x, pixel.y-1);
				pixel.element = "nothing_there_phase_3_body";
				pixel.color = pixelColorPick(pixel)
			} else {
				deletePixel(pixel.x, pixel.y);
			}
		},
		related: ["nothing_there_phase_3_body","nothing_there_phase_3_head"],
	};

	elements.nothing_there_phase_3_body = {
		color: "#fc1e35",
		category: "life",
		density: 3000,
		desc: "O-06-20 <span style='color: red;'>(ALEPH)</span><br/>In this phase, it looks like a humanoid made of misarranged flesh. It is almost indestructible and has a variety of ways to destroy your canvas and annihilate any humans inside of it.<br/>Let's hope it doesn't learn to blend in and walk among us.",
		state: "solid",
		tempHigh: 3000,
		hardness: 0.9975,
		hidden: true,
		stateHigh: "cooked_meat",
		burn: 1,
		burnTime: 300000,
		burnInto: "cooked_meat",
		breakInto: (enabledMods.includes("mods/fey_and_more.js") ? ["blood","meat","magic"] : ["blood","meat"]),
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.00001 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.00002 },
			"plague": { "elem1":"plague", "chance":0.0000015 },
		},
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			following: false,
		},
		movable: true,
		related: ["nothing_there_phase_1", "nothing_there_phase_2", "nothing_there_mace", "nothing_there_cleaver", "nothing_there_bullet"],
		tick: function(pixel) {
			var pixelBreakInto = elements[pixel.element].breakInto;

			if (tryMove(pixel, pixel.x, pixel.y+1)) { // Fall
				if (!isEmpty(pixel.x, pixel.y-2, true)) { // Drag head down
					var headPixel = pixelMap[pixel.x][pixel.y-2];
					if (headPixel.element == "nothing_there_phase_3_head") {
						if (isEmpty(pixel.x, pixel.y-1)) {
							movePixel(pixelMap[pixel.x][pixel.y-2], pixel.x, pixel.y-1);
						}
						else {
							swapPixels(pixelMap[pixel.x][pixel.y-2], pixelMap[pixel.x][pixel.y-1]);
						}
					}
				}
			}
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Break if pixelTicks-dead > 5
				if (pixelTicks-pixel.dead > 5) {
					changePixel(pixel,pixelBreakInto[Math.floor(Math.random() * pixelBreakInto.length)],false);
				};
				return;
			};

			// Find the head
			if (!isEmpty(pixel.x, pixel.y-1, true)) {
				if(pixelMap[pixel.x][pixel.y-1].element == "nothing_there_phase_3_head") {
					var head = pixelMap[pixel.x][pixel.y-1];
					if (head.dead) { // If head is dead, kill body
						pixel.dead = head.dead;
					};
				} else {
					var head = null;
				};
			} else { var head = null };

			if (isEmpty(pixel.x, pixel.y-1)) {
				// create blood if decapitated 30% chance
				if (Math.random() < 0.3) {
					createPixel("blood", pixel.x, pixel.y-1);
					// set dead to true 10% chance
					if (Math.random() < 0.1) {
						pixel.dead = pixelTicks;
					}
				}
			}
			else if (head == null) { return } //do not proceed if headless
			else if (Math.random() < 0.08) { // Move 10% chance
				var movesToTry = [
					[1*pixel.dir,0],
					[1*pixel.dir,-1],
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
						if (tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
							movePixel(head, head.x+move[0], head.y+move[1]);
							break;
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!head.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};
		},
	};

	elements.nothing_there_phase_3_head = {
		color: "#ff3046",
		category: "life",
		density: 3000,
		desc: "O-06-20 <span style='color: red;'>(ALEPH)</span><br/>In this phase, it looks like a humanoid made of misarranged flesh. It is almost indestructible and has a variety of ways to destroy your canvas and annihilate any humans inside of it.<br/>Let's hope it doesn't learn to blend in and walk among us.",
		state: "solid",
		tempHigh: 3000,
		hardness: 0.9975,
		hidden: true,
		stateHigh: "cooked_meat",
		burn: 1,
		burnTime: 300000,
		burnInto: "cooked_meat",
		breakInto: (enabledMods.includes("mods/fey_and_more.js") ? ["blood","meat","magic"] : ["blood","meat"]),
		reactions: {
			"cancer": { "elem1":"cancer", "chance":0.00001 },
			"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.00002 },
			"plague": { "elem1":"plague", "chance":0.0000015 },
		},
		properties: {
			dead: false,
			dir: 1,
			panic: 0,
			following: false,
		},
		movable: true,
		related: ["nothing_there_phase_1", "nothing_there_phase_2", "nothing_there_mace", "nothing_there_cleaver", , "nothing_there_bullet"],
		tick: function(pixel) {
			var pixelBreakInto = elements[pixel.element].breakInto;
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Break if pixelTicks-dead > 5
				if (pixelTicks-pixel.dead > 5) {
					changePixel(pixel,pixelBreakInto[Math.floor(Math.random() * pixelBreakInto.length)],false);
				};
				return;
			};

			// Find the body
			if (!isEmpty(pixel.x, pixel.y+1, true)) {
				if(pixelMap[pixel.x][pixel.y+1].element == "nothing_there_phase_3_body") {
					var body = pixelMap[pixel.x][pixel.y+1];
					if (body.dead) { // If body is dead, kill body
						pixel.dead = body.dead;
					};
				} else {
					var body = null;
				};
			} else { var body = null };

			if(body) {
				if(body.dir !== pixel.dir) { //hacky workaround: lock head dir to body dir
					pixel.dir = body.dir;
				};
			};

			if (isEmpty(pixel.x, pixel.y+1)) {
				tryMove(pixel, pixel.x, pixel.y+1);
				// create blood if severed 30% chance
				if (isEmpty(pixel.x, pixel.y+1) && Math.random() < 0.3) {
					createPixel("blood", pixel.x, pixel.y+1);
					// set dead to true 10% chance
					if (Math.random() < 0.10) {
						pixel.dead = pixelTicks;
					}
				}
			}
			
			//start of most new code
			var pX = pixel.x;
			var pY = pixel.y;
			
			//Human detection loop
			if(pixelTicks % 2 == 0 && !pixel.dead) { //reduce rate for performance
				/*var directionAdverb = "left";
				if(pixel.dir > 0) {
					directionAdverb = "right";
				};*/
				//console.log(`Looking ${directionAdverb}`)
				if(pixel.dir === -1) {
					//do action every 40 ticks
					var bulletPositions = [[-1, -1], [-1, 0]];
					var bulletPosition = bulletPositions[Math.floor(Math.random() * 2)];
					
					var smashPosition = [-1, -1];
					
					var cleavePositions = [[-1, -1], [-2, -1], [-3, -1]];
					
					var start = 2 * Math.floor(pixel.start/2);
					if((pixelTicks - start) % 40 == 0) {
						var action = Math.floor(Math.random() * 3);
						if(action == 0) { //bullet
							var bX = pX + bulletPosition[0];
							var bY = pY + bulletPosition[1];
							
							if(!outOfBounds(bX,bY)) {
								if(isEmpty(bX,bY)) {
									createPixel("nothing_there_bullet",bX,bY);
									pixelMap[bX][bY].flipX = true;
								} else {
									if(!nothingThereBulletExcludedElements.includes(pixelMap[bX][bY].element)) {
										deletePixel(bX,bY);
										createPixel("nothing_there_bullet",bX,bY);
										pixelMap[bX][bY].flipX = true;
									};
								};
							};
						} else if(action == 1) { //smash
							var sX = pX + smashPosition[0];
							var sY = pY + smashPosition[1];
							
							if(!outOfBounds(sX,sY)) {
								if(isEmpty(sX,sY)) {
									createPixel("nothing_there_mace",sX,sY);
								} else {
									if(!nothingThereBulletExcludedElements.includes(pixelMap[sX][sY].element)) {
										deletePixel(sX,sY);
										createPixel("nothing_there_mace",sX,sY);
									};
								};
							};
						} else if(action == 2) { //cleave
							for(cleaverIndex = 0; cleaverIndex < cleavePositions.length; cleaverIndex++) {
								var cX = pX + cleavePositions[cleaverIndex][0];
								var cY = pY + cleavePositions[cleaverIndex][1];
								
								if(!outOfBounds(cX,cY)) {
									if(isEmpty(cX,cY)) {
										createPixel("nothing_there_cleaver",cX,cY);
									} else {
										if(!nothingThereBulletExcludedElements.includes(pixelMap[cX][cY].element)) {
											deletePixel(cX,cY);
											createPixel("nothing_there_cleaver",cX,cY);
										};
									};
								};
							};
						};
					};
					
					for(i = -4; i < 4+1; i++) {
						var oY = i;
						//console.log(`Starting row look at row ${pY+oY}`)
						for(j = (-1); j > (-35 - 1); j--) {
							var oX = j;
							var nX = pX+oX;
							var nY = pY+oY;
							if(outOfBounds(nX,nY)) {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
								break;
							};
							if(isEmpty(nX,nY)) {
								////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
								continue;
							};
							if(!isEmpty(nX,nY,true)) {
								var newPixel = pixelMap[nX][nY];
								var newElement = newPixel.element;
								if(enemyHumanoidArray.includes(newElement)) {
									//console.log(`Human part found at (${nX},${nY})`)
									if(!newPixel.dead) { //If not dead
										pixel.following = true;
										//console.log(`Human detected at (${nX},${nY})`)
										//Infect/kill if a human is close enough
										if(pyth(pX,pY,nX,nY) <= 1.5) { //approx. sqrt(2)
											if(Math.random() < 1/4) {	//One-fourth chance to change to blood
												changePixel(newPixel,"blood",false);
											} else {					//Remaining 3/4 chance to change to meat
												changePixel(newPixel,"meat",false);
											};
										};
									} else { //Mutilate if dead
										if(Math.random() < 1/4) {	//One-fourth chance to change to blood
											changePixel(newPixel,"blood",false);
										} else {					//Remaining 3/4 chance to change to meat
											changePixel(newPixel,"meat",false);
										};
									};
								} else {
									//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
									break; //can't see through humans
								};
							};
						};
					};
				} else if(pixel.dir === 1) {
					//do action every 40 ticks
					var bulletPositions = [[1, -1], [1, 0]];
					var bulletPosition = bulletPositions[Math.floor(Math.random() * 2)];
					
					var smashPosition = [1, -1];
					
					var cleavePositions = [[1, -1], [2, -1], [3, -1]];
					
					var start = 2 * Math.floor(pixel.start/2);
					if((pixelTicks - start) % 40 == 0) {
						var action = Math.floor(Math.random() * 3);
						if(action == 0) { //bullet
							var bX = pX + bulletPosition[0];
							var bY = pY + bulletPosition[1];
							
							if(!outOfBounds(bX,bY)) {
								if(isEmpty(bX,bY)) {
									createPixel("nothing_there_bullet",bX,bY);
									pixelMap[bX][bY].flipX = false;
								} else {
									if(!nothingThereBulletExcludedElements.includes(pixelMap[bX][bY].element)) {
										deletePixel(bX,bY);
										createPixel("nothing_there_bullet",bX,bY);
										pixelMap[bX][bY].flipX = false;
									};
								};
							};
						} else if(action == 1) { //smash
							var sX = pX + smashPosition[0];
							var sY = pY + smashPosition[1];
							
							if(!outOfBounds(sX,sY)) {
								if(isEmpty(sX,sY)) {
									createPixel("nothing_there_mace",sX,sY);
								} else {
									if(!nothingThereBulletExcludedElements.includes(pixelMap[sX][sY].element)) {
										deletePixel(sX,sY);
										createPixel("nothing_there_mace",sX,sY);
									};
								};
							};
						} else if(action == 2) { //cleave
							for(cleaverIndex = 0; cleaverIndex < cleavePositions.length; cleaverIndex++) {
								var cX = pX + cleavePositions[cleaverIndex][0];
								var cY = pY + cleavePositions[cleaverIndex][1];
								
								if(!outOfBounds(cX,cY)) {
									if(isEmpty(cX,cY)) {
										createPixel("nothing_there_cleaver",cX,cY);
									} else {
										if(!nothingThereBulletExcludedElements.includes(pixelMap[cX][cY].element)) {
											deletePixel(cX,cY);
											createPixel("nothing_there_cleaver",cX,cY);
										};
									};
								};
							};
						};
					};

					for(i = -4; i < 4+1; i++) {
						var oY = i;
						//console.log(`Starting row look at row ${pY+oY}`)
						for(j = 1; j < 35 + 1; j++) {
							var oX = j;
							var nX = pX+oX;
							var nY = pY+oY;
							if(outOfBounds(nX,nY)) {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
								break;
							};
							if(isEmpty(nX,nY)) {
								//console.log(`Skipping pixel (${nX},${nY}) (empty)`)
								continue;
							};
							if(!isEmpty(nX,nY,true)) {
								var newPixel = pixelMap[nX][nY];
								var newElement = newPixel.element;
								if(enemyHumanoidArray.includes(newElement)) {
									//console.log(`Human part found at (${nX},${nY})`)
									if(!newPixel.dead) { //If not dead
										pixel.following = true;
										//console.log(`Human detected at (${nX},${nY})`)
										//Infect/kill if a human is close enough
										if(pyth(pX,pY,nX,nY) <= 1.5) { //approx. sqrt(2)
											if(Math.random() < 1/4) {	//One-fourth chance to change to blood
												changePixel(newPixel,"blood",false);
											} else {					//Remaining 3/4 chance to change to meat
												changePixel(newPixel,"meat",false);
											};
										};
									} else { //Mutilate if dead
										if(Math.random() < 1/4) {	//One-fourth chance to change to blood
											changePixel(newPixel,"blood",false);
										} else {					//Remaining 3/4 chance to change to meat
											changePixel(newPixel,"meat",false);
										};
									};
								} else {
									//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
									break; //can't see through humans
								};
							};
						};
					};
				};
			};
					
			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};
		},
	};

	runAfterLoad(function() {
		if(typeof(badPixels) === "object") {
			badPixels.nothing_there_phase_1 = { panicIncrease: 1, panicIncreaseChance: 1 } //insta-panic for "aleph" thing and "level 1" humans
			badPixels.nothing_there_phase_2 = { panicIncrease: 1, panicIncreaseChance: 1 }
			badPixels.nothing_there_phase_3_body = { panicIncrease: 1, panicIncreaseChance: 1 }
			badPixels.nothing_there_phase_3_head = { panicIncrease: 1, panicIncreaseChance: 1 }
		}
	});

	/* +-----------------------------------+
	   | End Nothing There elements        |
	   |                                   |
	   |                                   |
	   |                                   |
	   |                                   |
	   |                                   |
	   +-----------------------------------+ */

	/* Creeper generation
	___#___#___#___#___#___#___#___#___#___
	__#___#___#___#___#___#___#___#___#___#
	_#___#___#___#___#___#___#___#___#___#_
	#___#___#___#___#___#___#___#___#___#__
	___#___#___#___#___#___#___#___#___#___
	__#___#___#___#___#___#___#___#___#___#
	_#___#___#___#___#___#___#___#___#___#_
	#___#___#___#___#___#___#___#___#___#__
	___#___#___#___#___#___#___#___#___#___
	__#___#___#___#___#___#___#___#___#___#
	_#___#___#___#___#___#___#___#___#___#_
	#___#___#___#___#___#___#___#___#___#__
	___#___#___#___#___#___#___#___#___#___
	__#___#___#___#___#___#___#___#___#___#
	_#___#___#___#___#___#___#___#___#___#_
	#___#___#___#___#___#___#___#___#___#__
	*/

		//This code is a lot worse than I'd have liked it to be...



	urlParams = new URLSearchParams(window.location.search);

	//Include generated creepers in Random tool?
	if(urlParams.get('creeperIncludeRandom') !== null) { //if the variable exists at all
		creeperIncludeRandom = true
	} else { //if it doesn't (and it returns null)
		creeperIncludeRandom = false
	}

	//Start Creeper Template Functions {

		autoCreeperPlacerTick = function(pixel) {
			var creeperElement = elements[pixel.element].creeperType;
			var headName,bodyName;
			if(typeof(creeperElement === "string")) { //comma separated string check
				if(creeperElement.includes(",")) { //if it is
					creeperElement = creeperElement.split(","); //to array
					creeperElement = creeperElement.filter(function(e) { //strip nonexistent elements
						return typeof(elements[e]) === "object";
					});
				};
			};
			if(Array.isArray(creeperElement)) {
				headName = `${creeperElement.join("_")}_creeper_head`; //auto head element name
				bodyName = `${creeperElement.join("_")}_creeper_body`; //auto body element name
			} else {
				headName = `${creeperElement}_creeper_head`; //auto head element name
				bodyName = `${creeperElement}_creeper_body`; //auto body element name
			};
			if (isEmpty(pixel.x, pixel.y+1)) {
				createPixel(bodyName, pixel.x, pixel.y+1);
				pixel.element = headName;
				pixel.color = pixelColorPick(pixel)
			} else if (isEmpty(pixel.x, pixel.y-1)) {
				createPixel(headName, pixel.x, pixel.y-1);
				pixel.element = bodyName;
				pixel.color = pixelColorPick(pixel)
			} else {
				deletePixel(pixel.x, pixel.y);
			};
		};

		autoCreeperBodyTick = function(pixel) {
			var creeperElement = elements[pixel.element].creeperType;
			var headName,bodyName,explodeInto;
			if(typeof(creeperElement === "string")) { //comma separated string check
				if(creeperElement.includes(",")) { //if it is
					creeperElement = creeperElement.split(","); //to array
					creeperElement = creeperElement.filter(function(e) { //strip nonexistent elements
						return typeof(elements[e]) === "object";
					});
				};
			};
			if(Array.isArray(creeperElement)) {
				headName = `${creeperElement.join("_")}_creeper_head`; //auto head element name
				bodyName = `${creeperElement.join("_")}_creeper_body`; //auto body element name
				explodeInto = creeperElement.join(","); //auto body element name
			} else {
				headName = `${creeperElement}_creeper_head`; //auto head element name
				bodyName = `${creeperElement}_creeper_body`; //auto body element name
				explodeInto = creeperElement; //auto body element name
			};
			if (tryMove(pixel, pixel.x, pixel.y+1)) { // Fall
				if (!isEmpty(pixel.x, pixel.y-2, true)) { // Drag head down
					var headPixel = pixelMap[pixel.x][pixel.y-2];
					if (headPixel.element == headName) {
						if (isEmpty(pixel.x, pixel.y-1)) {
							movePixel(pixelMap[pixel.x][pixel.y-2], pixel.x, pixel.y-1);
						}
						else {
							swapPixels(pixelMap[pixel.x][pixel.y-2], pixelMap[pixel.x][pixel.y-1]);
						}
					}
				}
			}
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
				}
				return
			}

			// Find the head
			if (!isEmpty(pixel.x, pixel.y-1, true) && pixelMap[pixel.x][pixel.y-1].element == headName) {
				var head = pixelMap[pixel.x][pixel.y-1];
				if (head.dead) { // If head is dead, kill body
					pixel.dead = head.dead;
				}
			}
			else { var head = null }

			if (isEmpty(pixel.x, pixel.y-1)) {
				// create blood if decapitated 10% chance
				if (Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y-1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			else if (head == null) { return }
			else if (Math.random() < 0.1) { // Move 10% chance
				var movesToTry = [
					[1*pixel.dir,0],
					[1*pixel.dir,-1],
				];
				// While movesToTry is not empty, tryMove(pixel, x, y) with a random move, then remove it. if tryMove returns true, break.
				while (movesToTry.length > 0) {
					var move = movesToTry.splice(Math.floor(Math.random() * movesToTry.length), 1)[0];
					if (isEmpty(pixel.x+move[0], pixel.y+move[1]-1)) {
						if (tryMove(pixel, pixel.x+move[0], pixel.y+move[1])) {
							movePixel(head, head.x+move[0], head.y+move[1]);
							break;
						};
					};
				};
				// 15% chance to change direction while not chasing a human
				if(!head.following) {
					if (Math.random() < 0.15) {
						pixel.dir *= -1;
						//console.log("*turns around cutely to face ${pixel.dir < 0 ? 'left' : 'right'}*");
					};
				}/* else {
					//console.log("*chases cutely*");
				};*/
			};

			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(head) {
				if(typeof(head.charge) !== "undefined") {
					if(head.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(head.charged) !== "undefined") {
					if(head.charged) {
						pixel.charged = true;
					};
				};
			};

			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 7;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 5;
			};
			
			if(pixel.burning) {
				pixel.hissing = true;
				if(!pixel.hissStart) {
					pixel.hissStart = pixelTicks;
				};
				if(!pixel.burnStart) { //I don't like errors.
					pixel.burnStart = pixel.ticks;
				};
				if(pixelTicks - pixel.burnStart > 30) {
					//console.log("Kaboom?");
					explodeAt(pixel.x,pixel.y,explosionRadius,creeperElement);
					//console.log("Yes, Rico, kaboom.");
				};
			};

			//Head hissing color handler: keeps track of head's hissing for coloring purposes
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.dead || !head || head.dead) { //can't hiss without a head according to the classic creeper anatomy
					//console.log("ss-- oof");
					pixel.hissing = false;
					break;
				};
				if(head.hissing) {
					//console.log("Ssssssss");
					if(!head.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						head.hissStart = pixelTicks;
					};

					//Color code {
						var ticksHissing = pixelTicks - head.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							//console.log("the j");
							luminance = slBound(luminance + 1.176);
							//console.log(luminance);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}
				};
			};
		};

		autoCreeperHeadTick = function(pixel) {
			var creeperElement = elements[pixel.element].creeperType;
			var headName,bodyName,explodeInto;
			if(typeof(creeperElement === "string")) { //comma separated string check
				if(creeperElement.includes(",")) { //if it is
					creeperElement = creeperElement.split(","); //to array
					creeperElement = creeperElement.filter(function(e) { //strip nonexistent elements
						return typeof(elements[e]) === "object";
					});
				};
			};
			if(Array.isArray(creeperElement)) {
				headName = `${creeperElement.join("_")}_creeper_head`; //auto head element name
				bodyName = `${creeperElement.join("_")}_creeper_body`; //auto body element name
				explodeInto = creeperElement.join(","); //auto body element name
			} else {
				headName = `${creeperElement}_creeper_head`; //auto head element name
				bodyName = `${creeperElement}_creeper_body`; //auto body element name
				explodeInto = creeperElement; //auto body element name
			};
			doHeat(pixel);
			doBurning(pixel);
			doElectricity(pixel);
			if (pixel.dead) {
				// Turn into rotten_meat if pixelTicks-dead > 500
				if (pixelTicks-pixel.dead > 200) {
					Math.random() < 0.1 ? changePixel(pixel,"gunpowder") : changePixel(pixel,"rotten_meat");
					return
				}
			}

			// Find the body
			if (!isEmpty(pixel.x, pixel.y+1, true) && pixelMap[pixel.x][pixel.y+1].element == bodyName) {
				var body = pixelMap[pixel.x][pixel.y+1];
				if (body.dead) { // If body is dead, kill head
					pixel.dead = body.dead;
				}
			}
			else { var body = null }

			if(body) {
				if(body.dir !== pixel.dir) { //hacky workaround: lock head dir to body dir
					pixel.dir = body.dir;
				};
			};

			if (isEmpty(pixel.x, pixel.y+1)) {
				tryMove(pixel, pixel.x, pixel.y+1);
				// create blood if severed 10% chance
				if (isEmpty(pixel.x, pixel.y+1) && !pixel.dead && Math.random() < 0.1) {
					createPixel("blood", pixel.x, pixel.y+1);
					// set dead to true 15% chance
					if (Math.random() < 0.15) {
						pixel.dead = pixelTicks;
					}
				}
			}
			
			//start of most new code
			var pX = pixel.x;
			var pY = pixel.y;
			
			if(pixel.charge) {
				pixel.charged = true;
			};
			
			if(body) {
				if(typeof(body.charge) !== "undefined") {
					if(body.charge) {
						pixel.charged = true;
					};
				};
				if(typeof(body.charged) !== "undefined") {
					if(body.charged) {
						pixel.charged = true;
					};
				};
			};
			
			if(typeof(pixel.charged) === "undefined") {
				pixel.charged = false;
			};

			if(pixel.charged) {
				var explosionRadius = 10;
				if(!pixel.didChargeBlueTinted) { //do once, on initial charge
					//console.log("something something halsey lyric");
					var color = pixel.color;
					if(color.startsWith("rgb")) {
						//console.log("rgb detected");
						color = color.split(","); //split color for addition
						var red = parseFloat(color[0].substring(4));
						var green = parseFloat(color[1]);
						var blue = parseFloat(color[2].slice(0,-1));
						red = rgbColorBound(red + 51);
						green = rgbColorBound(green + 51);
						blue = rgbColorBound(blue + 102);
						color = `rgb(${red},${green},${blue})`;
						pixel.color = color;
						//console.log("color set");
					} else if(color.startsWith("hsl")) {
						//console.log("hsl detected");
						color = color.split(","); //split color for addition
						var hue = parseFloat(color[0].substring(4));
						var saturation = parseFloat(color[1].slice(0,-1));
						var luminance = parseFloat(color[2].slice(0,-2));
						hue = hue % 360; //piecewise hue shift
						if(hue <= 235 && hue >= 135) {
							hue = 185;
						} else if(hue < 135) {
							hue += 50;
						} else if(hue > 235 && hue < 360) {
							hue -= 50;
						};
						saturation = slBound (saturation + 10);
						luminance = slBound(luminance + 20);
						color = `hsl(${hue},${saturation}%,${luminance}%)`;
						pixel.color = color;
						//console.log("color set");
					};
					pixel.didChargeBlueTinted = true;
				};
			} else {
				var explosionRadius = 7;
			};
			
			//Human detection loop (looks ahead according to direction and sets the "following" variable to true, telling the body to lock the direction)
			var directionAdverb = "left";
			if(pixel.dir > 0) {
				directionAdverb = "right";
			};
			//console.log(`Looking ${directionAdverb}`)
			if(pixel.dir === -1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = (-1); j > (-16 - 1); j--) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) { //probably misapplying the tolerance from the MC Wiki line: "Creepers will chase after any player, as long as it is within a 16 block (±5%) radius"
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break; //can't see through humans
							};
						};
					};
				};
			} else if(pixel.dir === 1) {
				for(i = -4; i < 4+1; i++) {
					var oY = i;
					//console.log(`Starting row look at row ${pY+oY}`)
					for(j = 1; j < 16 + 1; j++) {
						var oX = j;
						var nX = pX+oX;
						var nY = pY+oY;
						if(outOfBounds(nX,nY)) {
							//console.log(`Stopping row look at pixel (${nX},${nY}) due to OoB`)
							break;
						};
						if(isEmpty(nX,nY)) {
							////console.log(`Skipping pixel (${nX},${nY}) (empty)`)
							continue;
						};
						if(!isEmpty(nX,nY,true)) {
							var newPixel = pixelMap[nX][nY];
							var newElement = newPixel.element;
							if(enemyHumanoidArray.includes(newElement)) {
								//console.log(`Human part found at (${nX},${nY})`)
								if(!newPixel.dead) {
									pixel.following = true;
									//console.log(`Human detected at (${nX},${nY})`)
									//Start "hissing" if a human is close enough
									if(pyth(pX,pY,nX,nY) <= 3.15) {
										pixel.hissing = true;
										if(!pixel.hissStart) {
											pixel.hissStart = pixelTicks;
										};
									};
									break;
								};
							} else {
								//console.log(`Stopping row look at pixel (${nX},${nY}) due to non-human pixel in the way`)
								break;
							};
						};
					};
				};
			};
			
			//Pre-explosion handler: keeps track of time before the kaboom
			for(i = 0; i < 1; i++) { //dummy for loop
				if(pixel.hissing) {
					//console.log("Ssssssss");
					if(pixel.dead || !body || body.dead) { //can't explode without a body according to the classic creeper anatomy
						//console.log("ss-- oof");
						pixel.hissing = false;
						break;
					};
					if(!pixel.hissStart) {
						//console.log("t-30 ticks or whatever it was");
						pixel.hissStart = pixelTicks;
					};
					//Color code {
						var ticksHissing = pixelTicks - pixel.hissStart;
						var color = pixel.color; //do on each hissing tick
						if(color.startsWith("rgb")) {
							//console.log("rgb detected");
							color = color.split(","); //split color for addition
							var red = parseFloat(color[0].substring(4));
							var green = parseFloat(color[1]);
							var blue = parseFloat(color[2].slice(0,-1));
							red = rgbColorBound(red + ticksHissing);
							green = rgbColorBound(green + ticksHissing);
							blue = rgbColorBound(blue + ticksHissing);
							color = `rgb(${red},${green},${blue})`;
							pixel.color = color;
							//console.log("color set");
						} else if(color.startsWith("hsl")) {
							//console.log("hsl detected");
							color = color.split(","); //split color for addition
							var hue = parseFloat(color[0].substring(4));
							var saturation = parseFloat(color[1].slice(0,-1));
							var luminance = parseFloat(color[2].slice(0,-2));
							luminance = slBound(luminance + 1.176);
							color = `hsl(${hue},${saturation}%,${luminance}%)`;
							pixel.color = color;
							//console.log("color set");
						};
					//}

					if(pixelTicks - pixel.hissStart > 30) {
						//console.log("Kaboom?");
						//console.log(`Exploding with element ${creeperElement} and radius ${explosionRadius} (charged: ${pixel.charged})`);
						explodeAt(body.x,body.y,explosionRadius,explodeInto);
						//console.log("Yes, Rico, kaboom.");
					};
				};
			};
			
			if(Math.random() < 0.01) { //1% chance each tick to lose interest
				pixel.following = false;
				//console.log("Meh.");
			};
		};

	//End Creeper Template Functions }

	//Start Color Functions and Variables {
		function sumArray(array) { //Sum of array numbers
			return array.reduce((partialSum, a) => partialSum + a, 0);
		};

		function averageArray(array) { //Average of array numbers
			return sumArray(array) / array.length;
		};
		
		function _rgbHexCatcher(color) { //Hex triplet to rgb(), while rgb() is untouched
				//console.log("Logged color for _rgbHexCatcher: " + color);
										 //I have no idea if this runs before or after parsing hex triplets to rgb() values, so I'm going to handle both (by making everything rgb() and then making it hex at the end)
			if(typeof(color) === "undefined") {
				//console.log("Warning: An element has an undefined color. Unfortunately, due to how the code is structured, I can't say which one.");
				color = "#FF00FF";
			};
			if(color.length < 10) {
				//console.log("Short string detected, likely a hex triplet");
				if(!color.startsWith("#")) {
					color = "#" + color;
				};
				var object = hexToRGB(color);
				return `rgb(${object.r},${object.g},${object.b})`
			} else {
				//console.log("Non-triplet detected");
				return color;
			};
		};

		function averageRgbPrefixedColorArray(colorArray,returnObject=false) { //array of rgb()s to single rgb() of average color
			//console.log("Averaging started");
			var reds = [];
			var greens = [];
			var blues = [];
			for(k = 0; k < colorArray.length; k++) {
				//console.log("Average function: Executing catcher on " + colorArray);
				var color = _rgbHexCatcher(colorArray[k]);
				//console.log("Logged color for aRPCA: " + color);
				color = color.split(","); 
				var red = parseFloat(color[0].substring(4));
				reds.push(red)
				var green = parseFloat(color[1]);
				greens.push(green)
				var blue = parseFloat(color[2].slice(0,-1));
				blues.push(blue)
			};
			redAverage = Math.round(averageArray(reds));
			greenAverage = Math.round(averageArray(greens));
			blueAverage = Math.round(averageArray(blues));
			var output; 
			returnObject ? output = {r: redAverage, g: greenAverage, b: blueAverage} : output = `rgb(${redAverage},${greenAverage},${blueAverage})`;
			//console.log("Averaging finished, product: " + output);
			return output;
		};
		//averageRgbPrefixedColorArray(["rgb(255,0,0)", "rgb(0,0,0)", "rgb(0,0,255)"]);

		function rgbStringToUnvalidatedObject(string) { //turns rgb() to {r,g,b} with no bounds checking
			//console.log("Splitting string into object");
			string = string.split(",");
			var red = parseFloat(string[0].substring(4));
			var green = parseFloat(string[1]);
			var blue = parseFloat(string[2].slice(0,-1));
			//console.log("String split: outputs " + red + ", " + green + ", " + blue + ".");
			return {r: red, g: green, b: blue};
		};

		//https://stackoverflow.com/questions/46432335/hex-to-hsl-convert-javascript
		function rgbStringToHSL(rgb) { //Originally a hex-to-HSL function, edited to take RGB and spit out an array
			//console.log("HSLing some RGBs");
			var result = rgbStringToUnvalidatedObject(rgb);

			var r = result.r;
			var g = result.g;
			var b = result.b;

			r /= 255, g /= 255, b /= 255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;

			if(max == min){
				h = s = 0; // achromatic
			} else {
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch(max) {
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			};

			s = s*100;
			s = Math.round(s);
			l = l*100;
			l = Math.round(l);
			h = Math.round(360*h);

			//var colorInHSL = 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
			//Edit to return an array
			var colorInHSL = [h,s,l];
			//console.log("HSL output "+ colorInHSL + ".");
			return colorInHSL;
		};

		//https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex
		function hslToHex(h, s, l) { //h, s, l params to hex triplet
		  //console.log(`Hexing some HSLs (the HSLs are ${h},${s},${l})`)
		  l /= 100;
		  var a = s * Math.min(l, 1 - l) / 100;
		  var f = n => {
			var k = (n + h / 30) % 12;
			var color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
		  };
		  //console.log(`Hexed to #${f(0)}${f(8)}${f(4)}`)
		  return `#${f(0)}${f(8)}${f(4)}`;
		};
		
		function pad_array(arr,len,fill) { //https://stackoverflow.com/a/38851957
			//console.log("Padding array");
			return arr.concat(Array(len).fill(fill)).slice(0,len);
		}
		
		function addArraysInPairs(array1,array2,fill=0) { //e.g. [1,2,3] + [10,0,-1] = [11,2,2]
			//console.log("Adding in pairs: " + array1 + " and " + array2 + ".");
			if(array1.length > array2.length) { //zero-padding
				array2 = pad_array(array2,array1.length,fill); //if a1 is longer, pad a2 to a1's length
			} else if(array2.length > array1.length) {
				array1 = pad_array(array1,array2.length,fill); //if a2 is longer, pad a1 to a2's length
			};
			var tempArray = [];
			for(z = 0; z < array1.length; z++) {
				//console.log("Forming output values (" + array1[z] + " + " + array2[z] + ")");
				tempArray[z] = array1[z] + array2[z];
				//console.log("Sum" + tempArray[z]);
			};
			//console.log("Added into " + tempArray + ".");
			return tempArray;
		};

		//var placeholderColor = "#FF00FF";
		
		var hslOffsets = [[0, -5, 5], [0, -20, 10], [0, 0, 10], [0, -20, 10], [0, -35, 0], [0, -20, -30], [0, 10, -10], [0, 10, 20], [0, -20, 10], [0, -10, 5]];
	//End Color Functions and Variables }

		var colorOfRandomCreeper = ["#7ba883", "#8aba8a", "#87b292", "#8aba8a", "#71a171", "#346434", "#4d6d72", "#a0caad", "#8aba8a", "#7dac7f"]
		//random_creeper's final color but all values of the sixth one increased by 16 decimal and then everything's R and B -= 48 decimal

		elements.spawn_random_creeper = {
			color: colorOfRandomCreeper,
			behavior: behaviors.WALL,
			category: "special",
			excludeRandom: false, //see below
			movable: true,
			tick: function(pixel) {
				changePixel(pixel,spawnCreepers[Math.floor(Math.random() * spawnCreepers.length)]) //spawnCreepers is already excludeRandom filtered
			},
		};

	runAfterAutogen(function() {
		//Creeper autogen function
		creeperElements = Object.keys(elements);
		creeperElements.push(["rock","sand"]);
		//creeperElements = ["water","steel","dirt",["dirt","sand"],"frostwind","antimatter,acid","fire,nonexist"]; //Test array
		for(aaf = 0; aaf < creeperElements.length; aaf++) {
			var elementOfCreeper = creeperElements[aaf];
			var startColor;
			var randomExcl = 0;
			//console.log("randomExcl set")
			//console.log(elementOfCreeper);

			var headName,bodyName,placerName,descElement;

			if(typeof(elementOfCreeper === "string")) { //comma separated string check
				if(elementOfCreeper.includes(",")) { //if it is
					elementOfCreeper = elementOfCreeper.split(","); //to array
					elementOfCreeper = elementOfCreeper.filter(function(e) { //strip nonexistent elements
						return typeof(elements[e]) === "object";
					});
				};
			};
			if(Array.isArray(elementOfCreeper)) {
				headName = `${elementOfCreeper.join("_")}_creeper_head`; //auto head element name
				bodyName = `${elementOfCreeper.join("_")}_creeper_body`; //auto body element name
				placerName = `${elementOfCreeper.join("_")}_creeper`; //auto placer element name
				descElement = elementOfCreeper.join(", "); //auto explosion element list
				
				//array case color concatenator and excludeRandom handler
				startColor = [];
				//console.log(elementOfCreeper);
				for(ll = 0; ll < elementOfCreeper.length; ll++) {
					if(typeof(elements[elementOfCreeper[ll]].excludeRandom !== "undefined")) { //if excludeRandom exists (prevent TypeError)
						if(elements[elementOfCreeper[ll]].excludeRandom) { //it it's true
							randomExcl = 1; //the whole array creeper is excluded
							//console.log("array nyet" + elementOfCreeper);
						};
					};
					//console.log(elementOfCreeper[ll]);
					startColor = startColor.concat(elements[elementOfCreeper[ll]].color);
				};
			} else { //they should all be strings, so here
				headName = `${elementOfCreeper}_creeper_head`; //auto head element name
				bodyName = `${elementOfCreeper}_creeper_body`; //auto body element name
				placerName = `${elementOfCreeper}_creeper`; //auto placer element name
				descElement = elementOfCreeper; //auto explosion element
				startColor = elements[elementOfCreeper].color;
				if(typeof(elements[elementOfCreeper].excludeRandom !== "undefined")) { //if excludeRandom exists (prevent TypeError)
					if(elements[elementOfCreeper].excludeRandom) { //it it's true
						//console.log("nyet " + elementOfCreeper);
						randomExcl = 1; //the creeper is excluded
					} else {
						//console.log("allow " + elementOfCreeper);
						randomExcl = 0;
					};
				};
			};
				//Color gen
			if(Array.isArray(startColor)) { //Average arrays, make colors rgb()
				startColor = averageRgbPrefixedColorArray(startColor);
			} else {
				startColor = _rgbHexCatcher(startColor);
			};
			var preColor = rgbStringToHSL(startColor);
			var colorsArray = [preColor, preColor, preColor, preColor, preColor, preColor, preColor, preColor, preColor, preColor]
			var colorObjectArray = [];
			for(q = 0; q < hslOffsets.length; q++) {
				colorsArray[q] = addArraysInPairs(colorsArray[q],hslOffsets[q]);
				colorsArray[q] = hslToHex((colorsArray[q][0] % 360),slBound(colorsArray[q][1]),slBound(colorsArray[q][2]));
				colorObjectArray[q] = hexToRGB(colorsArray[q]); //hex to RGB
				var coq = colorObjectArray[q]; //pull the object
				colorsArray[q] = `rgb(${coq.r},${coq.g},${coq.b})`; //and change to the RGB from its values
			};
			
				//End color gen
			
			//console.log(`${headName}; ${bodyName}; ${placerName}; ${descElement}`)

											//Placer
			elements[placerName] = {
				creeperType: elementOfCreeper,
				color: colorsArray,
				colorObject: colorObjectArray,
				category: "auto creepers",
				properties: {
					dead: false,
					dir: 1,
					panic: 0,
					following: false,
				},
				tick: function(pixel) {
					autoCreeperPlacerTick(pixel);
				},
				related: [bodyName,headName,"creeper"],
				desc: `Auto-generated creeper.<br/>Explodes into ${descElement}.`,
			};
											//Body
			elements[bodyName] = {
				creeperType: elementOfCreeper,
				color: colorsArray,
				colorObject: colorObjectArray,
				category: "auto creepers",
				hidden: true,
				excludeRandom: true,
				density: 1500,
				state: "solid",
				conduct: 25,
				tempHigh: 250,
				stateHigh: "cooked_meat",
				tempLow: -30,
				stateLow: "frozen_meat",
				burn: 10,
				burnTime: 250,
				burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","gunpowder"],
				breakInto: ["blood","gunpowder"],
				reactions: {
					"cancer": { "elem1":"cancer", "chance":0.005 },
					"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
					"plague": { "elem1":"plague", "chance":0.05 },
				},
				properties: {
					dead: false,
					dir: 1,
					panic: 0,
					charged: false,
					didChargeBlueTinted: false,
				},
				tick: function(pixel) {
					autoCreeperBodyTick(pixel);
				},
			};

											//Head
			elements[headName] = {
				creeperType: elementOfCreeper,
				color: colorsArray,
				colorObject: colorObjectArray,
				category: "auto creepers",
				hidden: true,
				excludeRandom: true,
				density: 1080,
				state: "solid",
				conduct: 25,
				tempHigh: 250,
				stateHigh: "cooked_meat",
				tempLow: -30,
				stateLow: "frozen_meat",
				burn: 10,
				burnTime: 250,
				burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","gunpowder"],
				breakInto: "blood",
				reactions: {
					"cancer": { "elem1":"cancer", "chance":0.005 },
					"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
					"plague": { "elem1":"plague", "chance":0.05 },
					"oxygen": { "elem2":"carbon_dioxide", "chance":0.5 },
				},
				properties: {
					dead: false,
					following: false,
					hissing: false,
					charged: false,
					didChargeBlueTinted: false,
				},
				tick: function(pixel) {
					autoCreeperHeadTick(pixel);
				},
			};
			if(creeperIncludeRandom) {
				randomExcl ? elements[placerName].excludeRandom = true : elements[placerName].excludeRandom = false;
			} else {
				elements[placerName].excludeRandom = true;
			};
			if(!randomExcl) {
				//console.log("spawn enabling " + placerName);
				spawnCreepers.push(placerName);
			} else {
				//console.log("nyetted " + placerName);
			};
			
			headBodyObject[headName] = bodyName;
		};
	});

	//Standalone generator function

	function generateCreeper(creeperElements,isAfterScriptLoading=false) {//it can be a single element, though
		//To specify an array creeper, have the array be inside another array.
		/*For reasons related to how element colors are loaded, if this function is being run from a JS mod file, isAfterScriptLoading should be false.
		Otherwise, you'll get TypeErrors for some reason when trying to place your creeper.  If this is being run after the game has loaded (e.g. in the console),
		then isAfterScriptLoading should be true or you might also get TypeErrors (this latter case was a bit inconsistent when I tested it, but 
		the former case wasn't. **isAfterScriptLoading must be false when this function is run from a JS mod file**.*/
		if(typeof(creeperElements) === "string") { //it should be an array, so string check
			//console.log("String detected");
			if(creeperElements.includes(",")) { //comma-separated string?
				//console.log("Splitting string to array");
				creeperElements = creeperElements.split(","); //,SS to array
			} else {
				//console.log("Wrapping string in array");
				creeperElements = [creeperElements]; //single string to array 
			};
		};
		for(aaf = 0; aaf < creeperElements.length; aaf++) {
			var elementOfCreeper = creeperElements[aaf];
			var startColor;
			var randomExcl = 0;
			//console.log("randomExcl set")
			//console.log(elementOfCreeper);

			var headName,bodyName,placerName,descElement;

			if(typeof(elementOfCreeper === "string")) { //comma separated string check
				if(elementOfCreeper.includes(",")) { //if it is
					elementOfCreeper = elementOfCreeper.split(","); //to array
					elementOfCreeper = elementOfCreeper.filter(function(e) { //strip nonexistent elements
						return typeof(elements[e]) === "object";
					});
				};
			};
			if(Array.isArray(elementOfCreeper)) {
				headName = `${elementOfCreeper.join("_")}_creeper_head`; //auto head element name
				bodyName = `${elementOfCreeper.join("_")}_creeper_body`; //auto body element name
				placerName = `${elementOfCreeper.join("_")}_creeper`; //auto placer element name
				descElement = elementOfCreeper.join(", "); //auto explosion element list
				
				//array case color concatenator and excludeRandom handler
				startColor = [];
				//console.log(elementOfCreeper);
				for(ll = 0; ll < elementOfCreeper.length; ll++) {
					if(typeof(elements[elementOfCreeper[ll]].excludeRandom !== "undefined")) { //if excludeRandom exists (prevent TypeError)
						if(elements[elementOfCreeper[ll]].excludeRandom) { //it it's true
							randomExcl = 1; //the whole array creeper is excluded
							//console.log("array nyet" + elementOfCreeper);
						};
					};
					//console.log(elementOfCreeper[ll]);
					startColor = startColor.concat(elements[elementOfCreeper[ll]].color);
				};
			} else { //they should all be strings, so here
				headName = `${elementOfCreeper}_creeper_head`; //auto head element name
				bodyName = `${elementOfCreeper}_creeper_body`; //auto body element name
				placerName = `${elementOfCreeper}_creeper`; //auto placer element name
				descElement = elementOfCreeper; //auto explosion element
				startColor = elements[elementOfCreeper].color;
				if(typeof(elements[elementOfCreeper].excludeRandom !== "undefined")) { //if excludeRandom exists (prevent TypeError)
					if(elements[elementOfCreeper].excludeRandom) { //it it's true
						//console.log("nyet " + elementOfCreeper);
						randomExcl = 1; //the creeper is excluded
					} else {
						//console.log("allow " + elementOfCreeper);
						randomExcl = 0;
					};
				};
			};
				//Color gen
			if(Array.isArray(startColor)) { //Average arrays, make colors rgb()
				startColor = averageRgbPrefixedColorArray(startColor);
			} else {
				startColor = _rgbHexCatcher(startColor);
			};
			var preColor = rgbStringToHSL(startColor);
			var colorsArray = [preColor, preColor, preColor, preColor, preColor, preColor, preColor, preColor, preColor, preColor]
			var colorObjectArray = [];
			for(q = 0; q < hslOffsets.length; q++) {
				colorsArray[q] = addArraysInPairs(colorsArray[q],hslOffsets[q]);
				colorsArray[q] = hslToHex((colorsArray[q][0] % 360),slBound(colorsArray[q][1]),slBound(colorsArray[q][2]));
				colorObjectArray[q] = hexToRGB(colorsArray[q]); //outputs hex
				if(isAfterScriptLoading) { // if it's after the hex -> RGB conversion
					var coq = colorObjectArray[q]; //pull the object
					colorsArray[q] = `rgb(${coq.r},${coq.g},${coq.b})`; //and change to the RGB from its values
				};
			};
			
				//End color gen
			
			//console.log(`${headName}; ${bodyName}; ${placerName}; ${descElement}`)

											//Placer
			elements[placerName] = {
				movable: true,
				creeperType: elementOfCreeper,
				color: colorsArray,
				colorObject: colorObjectArray,
				category: "auto creepers",
				properties: {
					dead: false,
					dir: 1,
					panic: 0,
					following: false,
				},
				tick: function(pixel) {
					autoCreeperPlacerTick(pixel);
				},
				related: [bodyName,headName,"creeper"],
				desc: `Auto-generated creeper.<br/>Explodes into ${descElement}.`,
			};
											//Body
			elements[bodyName] = {
				movable: true,
				creeperType: elementOfCreeper,
				color: colorsArray,
				colorObject: colorObjectArray,
				category: "auto creepers",
				hidden: true,
				excludeRandom: true,
				density: 1500,
				state: "solid",
				conduct: 25,
				tempHigh: 250,
				stateHigh: "cooked_meat",
				tempLow: -30,
				stateLow: "frozen_meat",
				burn: 10,
				burnTime: 250,
				burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","gunpowder"],
				breakInto: ["blood","gunpowder"],
				reactions: {
					"cancer": { "elem1":"cancer", "chance":0.005 },
					"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
					"plague": { "elem1":"plague", "chance":0.05 },
				},
				properties: {
					dead: false,
					dir: 1,
					panic: 0,
					charged: false,
					didChargeBlueTinted: false,
				},
				tick: function(pixel) {
					autoCreeperBodyTick(pixel);
				},
			};

											//Head
			elements[headName] = {
				movable: true,
				creeperType: elementOfCreeper,
				color: colorsArray,
				colorObject: colorObjectArray,
				category: "auto creepers",
				hidden: true,
				excludeRandom: true,
				density: 1080,
				state: "solid",
				conduct: 25,
				tempHigh: 250,
				stateHigh: "cooked_meat",
				tempLow: -30,
				stateLow: "frozen_meat",
				burn: 10,
				burnTime: 250,
				burnInto: ["cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","cooked_meat","gunpowder"],
				breakInto: "blood",
				reactions: {
					"cancer": { "elem1":"cancer", "chance":0.005 },
					"radiation": { "elem1":["ash","meat","rotten_meat","cooked_meat"], "chance":0.4 },
					"plague": { "elem1":"plague", "chance":0.05 },
					"oxygen": { "elem2":"carbon_dioxide", "chance":0.5 },
				},
				properties: {
					dead: false,
					following: false,
					hissing: false,
					charged: false,
					didChargeBlueTinted: false,
				},
				tick: function(pixel) {
					autoCreeperHeadTick(pixel);
				},
			};
			if(creeperIncludeRandom) {
				randomExcl ? elements[placerName].excludeRandom = true : elements[placerName].excludeRandom = false;
			} else {
				elements[placerName].excludeRandom = true;
			};
			if(!randomExcl) {
				//console.log("spawn enabling " + placerName);
				spawnCreepers.push(placerName);
			} else {
				//console.log("nyetted " + placerName);
			};
		};
	};
	
	var solidBlacklist = ["mistake", "birthpool", "firesea"]; //exclude these since they seem to be liquid
	
	solids = Object.keys(elements).filter(function(e) {
		return elements[e].category === "solids" && !solidBlacklist.includes(e);
	});
	
	for(i = 0; i < solids.length; i++) { //A lot of elements in solids, particularly metals, are missing a "state: solid".
		var solidName = solids[i]
		elements[solidName].state = "solid";
	};
	
} else {
	switch (enabledMods.includes(runAfterAutogenMod) + enabledMods.includes(explodeAtPlusMod)) {
		case 0:
			alert(`The "${runAfterAutogenMod}" and "${explodeAtPlusMod}" mods are required and has been automatically inserted (reload for this to take effect).`)
			enabledMods.splice(enabledMods.indexOf(modName),0,runAfterAutogenMod)
			enabledMods.splice(enabledMods.indexOf(modName),0,explodeAtPlusMod)
			localStorage.setItem("enabledMods", JSON.stringify(enabledMods));
			break;
		case 1:
			if(!enabledMods.includes(runAfterAutogenMod)) {
				alert(`The ${runAfterAutogenMod} mod is required and has been automatically inserted (reload for this to take effect).`)
				enabledMods.splice(enabledMods.indexOf(modName),0,runAfterAutogenMod)
				localStorage.setItem("enabledMods", JSON.stringify(enabledMods));
			} else if(!enabledMods.includes(explodeAtPlusMod)) {
				alert(`The ${explodeAtPlusMod} mod is required and has been automatically inserted (reload for this to take effect).`)
				enabledMods.splice(enabledMods.indexOf(modName),0,explodeAtPlusMod)
				localStorage.setItem("enabledMods", JSON.stringify(enabledMods));
			};
			break;
		default:
			console.log("Something's wrong with the dependency check switch...");
			break;
	};
};
