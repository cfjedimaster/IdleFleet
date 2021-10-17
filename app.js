import * as randomWordSlugs from "https://cdn.skypack.dev/random-word-slugs@0.1.5";

Vue.filter('number', s =>  {
  if(!window.Intl) return s;
  return new Intl.NumberFormat().format(s);
});

Vue.config.productionTip = false;
Vue.config.devtools = false;

/*
Constants for the game:
*/
const INITIAL_CREDITS = 500 * 999999;

// number of seconds for trip
const DURATION_MIN = 10;
const DURATION_MAX = 41;

// durations are in seconds, I change this when testing
const DURATION_INTERVAL = 1000;

// duration between random msg (in seconds):
const RANDOM_MSG_INTERVAL = 200;

// for random chit chat
const MESSAGES = [
 'Starbrand announces new line of eco-friendly spaceships.',
 'Economic reports continue to boom - stockholders happy!',
  'Most popular social network promises edit support soon.',
  'In a recent survey, ship captains report general satisifaction with job.',
  'In a recent survey, ship captains report general dissatisifaction with job.',
  'Billions reeling as social media star switches to new toilet paper brand.',
  'Galaxy-wide Outlook service down - please use tin cans in the meantime.'
 ];

// how big the log div can be
const MAX_LOG = 100;

// at this point, mercantile purchasing opens up
const ALLOW_MERCANTILE = 10000;

// at this point, ship speed purchasing opens up
const ALLOW_SHIPSPEED = 100000;

const app = new Vue({
  el:'#app',
  data: {
    ships:[],
    credits: INITIAL_CREDITS,
    log:[],
    mercantileSkill: 1,
    mercantileFlipped: false,
    nextShipReturnTime:null,
    shipSpeed: 1, 
    shipSpeedFlipped: false
  }, 
  created() {
    this.addShip();
    setInterval(this.randomMsg, RANDOM_MSG_INTERVAL * 1000);
    setInterval(this.updateNextShipReturnTime, 1000);
  },
  methods: {

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
            console.log('percent savings based on speed is ', percentSavings);
            console.log('return time was ', this.tripDuration);
            this.tripDuration -= Math.floor((this.tripDuration * (percentSavings/100)));
            console.log('return time is now ', this.tripDuration);
          }
          console.log('trip started, returns in '+this.tripDuration+ ' seconds');
          let now = new Date();
          now.setSeconds(now.getSeconds() + this.tripDuration);
          this.returnTime = now;

          let that = this;

          setTimeout(function() {
            that.available = true;
            that.returnTime = null;
            let moneyEarned = mainThat.earnMoney();
            mainThat.addLog(`${that.name} returned and earned ${moneyEarned} credits.`);
            mainThat.credits += moneyEarned;
          }, this.tripDuration*DURATION_INTERVAL);
        }
      };
      this.ships.push(newShip);
      this.addLog(`${newShip.name} purchased.`);
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

    earnMoney() {
      /*
      merc skill is rendered 1, 2, 3, etc, but it's actually:
      2/10, 3/10, etc, for #s above 10. so merc still 2 is 1.2 for a 20% bonus
      */
      let bonus = 1;
      if(this.mercantileSkill > 1) bonus += this.mercantileSkill/10;
      return Math.floor(getRandomInt(100, 1000) * bonus);
    },
    
    generateShipName() {
      const options = {
        format:'title',
        partsOfSpeech: ['adjective', 'noun'],
      }
      return randomWordSlugs.generateSlug(2, options);
    },
    randomMsg() {
      let msg = MESSAGES[getRandomInt(0, MESSAGES.length)];
      this.addLog(`<strong>${msg}</strong>`);
    },
    sendShips() {
      console.log('running sendShips');
      for(let i=this.availableShips.length-1;i>=0;i--) {
        console.log('sending ship '+this.availableShips[i].name);
        this.availableShips[i].trip();
      }
    },
    
    updateNextShipReturnTime() {
      let result = new Date(2099,1,1);
      let hasOne = false;
      for(let i=0;i<this.ships.length;i++) {
        if(this.ships[i].returnTime && this.ships[i].returnTime < result) {
          result = this.ships[i].returnTime;
          hasOne = true;
        }
      }
      if(hasOne) {
         this.nextShipReturnTime = Math.max(Math.floor((((new Date()) - result) / 1000) * -1),0) + ' seconds';
      } else return '';
      
    }

  },
  computed: {
    availableShips() {
      return this.ships.filter(s => s.available);
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
      return 1000 * this.ships.length;
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
