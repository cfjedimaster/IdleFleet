import * as randomWordSlugs from "https://cdn.skypack.dev/random-word-slugs@0.1.5";

Vue.filter('number', s =>  {
  return numberFormat(s);
});

Vue.config.productionTip = false;
Vue.config.devtools = false;

/*
Constants for the game:
*/
const INITIAL_CREDITS = 500;

// number of seconds for trip
const DURATION_MIN = 10;
const DURATION_MAX = 41;

// durations are in seconds, I change this when testing
const DURATION_INTERVAL = 1000;

// duration between random msg (in seconds):
const RANDOM_MSG_INTERVAL = 200;

// duration for AUTO SHIP
const AUTO_SHIP_DURATION = 20;

// how big the log div can be
const MAX_LOG = 100;

// at this point, mercantile purchasing opens up
const ALLOW_MERCANTILE = 10000;

// at this point, ship speed purchasing opens up
const ALLOW_SHIPSPEED = 100000;

// at this point, ship speed purchasing opens up
const ALLOW_AUTOSHIP = 1000000;

// at this point, credits per second stat opens up
const ALLOW_CEPS = 5000;
const CEPS_DURATION = 10;

const app = new Vue({
  el:'#app',
  data: {
    ships:[],
    credits: INITIAL_CREDITS,
    log:[],
    autoShip:false,
    autoShipFlipped:false,
    mercantileSkill: 1,
    mercantileFlipped: false,
    nextShipReturnTime:null,
    shipSpeed: 1, 
    shipSpeedFlipped: false,
    messages:null,
    ceps:null, 
    cepsFlipped:false,
    lastCEPS: INITIAL_CREDITS
  }, 
  async created() {
    this.addShip();
    setInterval(this.heartBeat, 1000);
    setInterval(this.randomMsg, RANDOM_MSG_INTERVAL * 1000);
    setInterval(this.doAutoShip, AUTO_SHIP_DURATION * 1000);
    //random events are not on intervals, but kick off first one 5ish minutes
    setTimeout(this.randomEvent, (5000 * 60) + (getRandomInt(0,3000)*60));
    // even though we dont show CEPS immediately, track immediately
    setInterval(this.generateCEPS, CEPS_DURATION * 1000);
    this.messages = await (await fetch('./messages.json')).json();
  },
  methods: {
    heartBeat() {
      /*
      heartBeat now handles all ship related travel announcements. 
      */

      let nextShipResult = new Date(2099,1,1);
      let hasNextShip = false;

      //loop through ships and see who is done
      for(let ship of this.ships) {
        //unavailable ships are traveling
        if(!ship.available) {
          if(new Date() > ship.returnTime) {
            ship.available = true;
            ship.returnTime = null;
            let moneyEarned = this.earnMoney();
            this.addLog(`${ship.name} returned and earned ${numberFormat(moneyEarned)} credits.`);
            this.credits += moneyEarned;
          } else if (ship.returnTime < nextShipResult) {
              nextShipResult = ship.returnTime;
              hasNextShip = true;
          }
        }


      }

      if(hasNextShip) {
        this.nextShipReturnTime = Math.max(Math.floor((((new Date()) - nextShipResult) / 1000) * -1),0) + ' seconds';
      } 

    },
    addLog(s) {
      this.log.push(s);
      if(this.log.length > MAX_LOG) this.log.shift();
      let that = this;
      if(this.$refs.logDiv) {
        setTimeout(function() {
          that.$refs.logDiv.scrollTop = that.$refs.logDiv.scrollHeight;
        }, 200);
      }
    },
    
    addShip() {
      let mainThat = this;
      // idea: new name based on npm package that picks nouns
      let name = this.generateShipName();
      let newShip = {
        available: true,
        name,
        returnTime:null,
        trip() {
          mainThat.addLog(`${this.name} departed...`);
          this.available = false;
          this.tripDuration = getRandomInt(DURATION_MIN, DURATION_MAX);
          // reduce by ship speed bonus
          /*
          current logic, given X for speed, you get 1-X percent saving, maxed at 95. 
          So if ship speed is 200, most likely you will max out
          */
          if(mainThat.shipSpeed >= 2) {
            let percentSavings = Math.min(getRandomInt(1, mainThat.shipSpeed), 95);
            //console.log('return time was ', this.tripDuration);
            this.tripDuration -= Math.floor((this.tripDuration * (percentSavings/100)));
            //console.log('return time is now ', this.tripDuration);
          }
          //console.log('trip started, returns in '+this.tripDuration+ ' seconds');
          let now = new Date();
          now.setSeconds(now.getSeconds() + this.tripDuration);
          this.returnTime = now;
        }
      };
      this.ships.push(newShip);
      this.addLog(`${newShip.name} acquired.`);
    },
    
    buyMercantile() {
      if(!this.canBuyMercantile) return;
      this.credits -= this.newMercantileCost;
      this.mercantileSkill++;
    },

    buyShip() {
      if(!this.canBuyShip) return;
      this.credits -= this.newShipCost;
      this.addShip();      
    },

    buyShipSpeed() {
      if(!this.canBuyShipSpeed) return;
      this.credits -= this.newShipSpeedCost;
      this.shipSpeed++;
    },

    doAutoShip() {
      if(this.autoShip) this.sendShips();
    },

    earnMoney() {
      /*
      merc skill is rendered 1, 2, 3, etc, but it's actually:
      2/10, 3/10, etc, for #s above 10. so merc still 2 is 1.2 for a 20% bonus
      update 10/20/2021 - dumb me, at 8 it was 0.8, you lost money. now i add 1.
      so 8 woudl be: 1.8
      20 would be 3
      */
      let bonus = 1;
      if(this.mercantileSkill > 1) bonus += (this.mercantileSkill/10) + 1;
      return Math.floor(getRandomInt(100, 1000) * bonus);
    },
    
    enableAutoShip() {
      this.autoShip = !this.autoShip;
    },

    generateCEPS() {
      let change = this.credits - this.lastCEPS;
      this.ceps = Math.floor(change / CEPS_DURATION);
      this.lastCEPS = this.credits;
    },

    generateShipName() {
      const options = {
        format:'title',
        partsOfSpeech: ['adjective', 'noun'],
      }
      return randomWordSlugs.generateSlug(2, options);
    },
    randomEvent() {
      /*
      Random events fall into 4 categories:
        get money
        lose money
        get ship
        lose ship

      for $$ stuff, it's always a percentage so the rewards are good later on
      */
      let whatHappened = getRandomInt(0, 100);

      if(whatHappened < 40) {
        let moneyWon = Math.floor(this.credits * (getRandomInt(10, 70)/100));
        let msg = this.messages.moneyWon[getRandomInt(0, this.messages.moneyWon.length)] + ` Gain ${numberFormat(moneyWon)} credits!`;
        this.credits += moneyWon;
        this.addLog(`<strong class="good">${msg}</strong>`);
      } else if(whatHappened < 80) {
        // if money is real low, do nothing
        if(this.credits < 500) return;
        let moneyLost = Math.floor(this.credits * (getRandomInt(5, 30)/100));
        let msg = this.messages.moneyLost[getRandomInt(0, this.messages.moneyLost.length)] + ` Lose ${numberFormat(moneyLost)} credits.`;
        this.credits -= moneyLost;
        this.addLog(`<strong class="bad">${msg}</strong>`);
      } else if(whatHappened < 92) {
        let msg = this.messages.shipWon[getRandomInt(0, this.messages.shipWon.length)];
        this.addLog(`<strong class="good">${msg}</strong>`);
        this.addShip();
      } else {
        /* disabled for now as I need to work on logic for removing a ship */
        return;
        if(this.ships.length < 10) return;
        let msg = this.messages.shipLost[getRandomInt(0, this.messages.shipLost.length)];
        this.addLog(`<strong class="bad">${msg}</strong>`);
        //no idea if this will break shit
        this.ships.shift();
      }

      setTimeout(this.randomEvent, (5000 * 60) + (getRandomInt(0,3000)*60));

    },
    randomMsg() {
      let msg = this.messages.news[getRandomInt(0, this.messages.news.length)];
      this.addLog(`<strong>${msg}</strong>`);
    },
    sendShips() {
      for(let i=this.availableShips.length-1;i>=0;i--) {
        this.availableShips[i].trip();
      }
    }    

  },
  computed: {
    availableShips() {
      return this.ships.filter(s => s.available);
    },
    autoShipAllowed() {
      // only flip once
      if(this.credits > ALLOW_AUTOSHIP) {
        this.autoShipFlipped = true;
      }
      return this.autoShipFlipped;
    },

    canBuyMercantile() {
      return this.credits >= this.newMercantileCost;
    },
    canBuyShip() {
      return this.credits >= this.newShipCost;
    },
    canBuyShipSpeed() {
      return this.credits >= this.newShipSpeedCost;
    },
    fleetSize() {
      return this.ships.length;
    },
    logDisplay() {
      return this.log.join('<br>');
    },
    cepsAllowed() {
      // only flip once
      if(this.credits > ALLOW_CEPS) {
        this.cepsFlipped = true;
      }
      return this.cepsFlipped;
    },
    mercantileAllowed() {
      // only flip once
      if(this.credits > ALLOW_MERCANTILE) {
        this.mercantileFlipped = true;
      }
      return this.mercantileFlipped;
    },
    newMercantileCost() {
      return 10000 * this.mercantileSkill;
    },
    newShipCost() {
      return 1250 * this.ships.length;
    },
    newShipSpeedCost() {
      return 10000 * this.shipSpeed;
    },
    numAvailableShips() {
      return this.availableShips.length;
    },
    shipsAvailable() {
     return this.availableShips.length > 0; 
    },
    shipSpeedAllowed() {
      // only flip once
      if(this.credits > ALLOW_SHIPSPEED) {
        this.shipSpeedFlipped = true;
      }
      return this.shipSpeedFlipped;
    }
  }
})

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); 
  //The maximum is exclusive and the minimum is inclusive
}

function numberFormat(s) {
  if(!window.Intl) return s;
  return new Intl.NumberFormat().format(s);
}