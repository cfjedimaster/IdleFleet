## IdleFleet

IdleFleet is a simple "idle clicker" game in the vein of (the much better) [Paperclips](https://www.decisionproblem.com/paperclips/index2.html). The mechanics are not spelled out in the game, and that's on purpose so as you play, things open up and surprise you.


### To Do

* For credits, over some limit, use this: https://www.raymondcamden.com/2023/01/04/using-intl-for-short-number-formatting
* Move conts into its own json.
* Add PWA support


### Changelog

* 3/3/2024: Added 'rank', based on merchant marine, with mods. 
* 3/3/2024: Moved out constants. Added a cheat mode so I don't have to 'hack' to test things. 
* 3/3/2024: Rebuilt in Alpine.js

* 11/10/2021: Rebuilt how time works (sounds dramatic, right)

* 10/22/2021: Add CEPS stat.

* 19/20/2021: Robert added auto ship feature, I tweaked. Also, mercantile skill was borked for < 10.

* 10/19/2021: Changed number formatting so that I could use it in Robert's change.

* 10/19/2021: Robert shared a PR that adds an amount to money earned/lost. I fixed a typo in my messages.

* 10/19/2021: Moved messages into a JSON file. Added random events that fall into 4 categories: win money, lose money, win ship, lose ship. Currently lose ship is disabled. 
