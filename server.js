const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');

const app = express();
app.use(bodyParser.json());
app.use(cors());

//testing git

const knex = require('knex')({
	client: 'pg',
	connection: {
    	connectionString: process.env.DATABASE_URL,
    	rejectUnauthorized: true
  	}
});

// account management
app.post('/register', (req, res) => {
	const {name, email, password} = req.body;
	const user_id = uuidv4();

	const salt = bcrypt.genSaltSync(10);
	const hash = bcrypt.hashSync(password, salt);	

	console.log('REGISTER ATTEMPTED')

	knex('users').select('*')
	.where({email: email})
	.then(user => {
		if (user[0])
		res.json('user already exsists ' + email);
		else {
			knex('users')
			.insert({user_id: user_id, name: name, email: email, hash: hash})
			.returning('*')
		  	.then(user => {
		  		console.log('logged')
		  		res.json(user[0]);
		  	})
		}
	});	
})

app.post('/login', (req, res) => {
	const {email, password} = req.body;

	console.log('LOGIN ATTEMPTED')


	knex('users').select('*')
  	.where({email: email})
  	.then(user => {
  		if (user.length)
  		{
  			console.log(user);
  		  	const isValid = bcrypt.compareSync(password, user[0].hash);
  		  	if (isValid) {
				console.log('logged in')		  		
				res.json(user[0]);  
  		  	}
  		  	else 
  		  		throw 'password not valid'
  		}
  		else
  		throw 'username not valid'
  	})
  	.catch(err => res.json('error'))
})

// data management 
// equipment
// Create new item
app.post('/newitem', (req, res) => {
	const {
		heroid,
		name,
		type
	} = req.body;

	const itemid = uuidv4();

	knex('items')
	.insert({
		heroid: heroid,
		itemid: itemid,
		name: name,
		type: type
	})
	.returning('*')
  	.then(info => {	
  		console.log(info);
  		knex('weapons')
  		.insert({
  			weaponid: itemid,
  			name: name
  		})
  		.returning('*')
  		.then(wep => {
  			res.json(wep);
  		})
  	})
  	.catch(err => res.json(err))
})

app.get('/hero_equipment/:hero_id', (req, res) => {
	const {hero_id} = req.params;
	knex.select('*')
  	.from('items')
  	.where({heroid: hero_id})
  	.returning('*')
  	.then(hero => {
  		if (hero.length)
  		{
  		  	res.json(hero[0]);
  		}
  		else
  		throw 'hero not valid'
  	})
  	.catch(err => res.json(err))
})

// create a blank character 
app.post('/newhero', (req, res) => {
	const {user_id, name} = req.body;
	const hero_id = uuidv4();

	knex('heroes')
	.insert({user_id: user_id, name: name, hero_id: hero_id})
  	.then(() => {	
  		knex('details')
		.insert({charactername: name, hero_id: hero_id})
		.returning('*')
	  	.then((info) => {
	  		knex('stats')
	  		.insert({hero_id: hero_id})
			.returning('*')
			.then((stats)=>{
				res.json(stats);
			})
	  	})
  	})
  	.catch(err => res.json(err))
})

// delete a character
app.post('/deletehero', (req, res) => {
	const {hero_id} = req.body;

	knex('heroes')
	.delete()
	.where({hero_id: hero_id})
  	.then(() => {	
  		knex('details')
		.delete()
		.where({hero_id: hero_id})
		.returning('*')
	  	.then((info) => {
	  		knex('stats')
	  		.delete()
	  		.where({hero_id: hero_id})
			.returning('*')
			.then((stats)=>{
				res.json(stats);
			})
	  	})
  	})
  	.catch(err => res.json(err))
})

// get all characters of a user
app.get('/heroes/:user_id', (req, res) => {
	const {user_id} = req.params;
	knex.select('*')
  	.from('heroes')
  	.where({user_id: user_id})
  	.then(heroes => {
  		if (heroes.length)
  		{
  		  	res.json(heroes);
  		}
  		else
  		throw 'user not valid'
  	})
  	.catch(err => res.json(err))
})

// get info on a character
app.get('/hero_info/:hero_id', (req, res) => {
	const {hero_id} = req.params;
	knex('details').select('*')
  	.where({hero_id: hero_id})
  	.then(hero => {
  		if (hero.length)
  		{
  		  	console.log(hero);
  		  	res.json(hero[0]);
  		}
  		else
  			{
  				res.json('ERROR no hero')
  			throw 'hero not valid'
  			}
  	})
  	.catch(err => res.json('server error: hero not found'))
})

// update info on a character
app.post('/hero_info', (req, res) => {
	const {hero_id, name, player, race, heroclass, alignment, deity, level, size, age, gender, height, weight, eyes, hair, herocolor, looks, about} = req.body;

	knex('details')
	.where({hero_id: hero_id})
	.update({
			playername: player, 
			charactername: name,
			race: race,
			heroclass: heroclass,
			alignment: alignment,
			deity: deity,
			level: level,
			size: size,
			age: age,
			gender: gender,
			height: height,
			weight: weight,
			eyes: eyes,
			hair: hair,
			herocolor: herocolor,
			looks: looks,
			about: about
		})
	.returning('*')
  	.then(info => {	
  		res.json(info);
  	})
  	.catch(err => res.json('server error: hero not found'))
})

// get stats on a character
app.get('/hero_stats/:hero_id', (req, res) => {
	const {hero_id} = req.params;
	knex.select('*')
  	.from('stats')
  	.where({hero_id: hero_id})
  	.then(hero => {
  		if (hero.length)
  		{
  		  	res.json(hero[0]);
  		}
  		else
  		throw 'hero not valid'
  	})
  	.catch(err => res.json(err))
})

// update stats of a character 
app.post('/hero_stats', (req, res) => {
	const {
		hero_id,
		strength,
		dexterity,
		constitution,
		intelligence,
		wisdom,
		charisma,
		totalhealth,
		currenthealth,
		hitdice,
		damagereduction,
		baseac,
		armorbonus,
		armorsizemod,
		armormiscmod,
		touchmiscmod,
		flatfootedmiscmod,
		baseattackbonus,
		attacksizemod,
		meleemiscmod,
		rangedmiscmod,
		basefort,
		fortmiscmod,
		basereflex,
		reflexmiscmod,
		basewillmod,
		willmiscmod,
		initiavemiscmod,
		movementspeed,
		damagetaken	
	} = req.body;

	knex('stats')
	.where({hero_id: hero_id})
	.update({
			strength: strength,
			dexterity: dexterity,
			constitution: constitution,
			intelligence: intelligence,
			wisdom: wisdom,
			charisma: charisma,
			totalhealth: totalhealth,
			currenthealth: currenthealth,
			hitdice: hitdice,
			damagereduction: damagereduction,
			baseac: baseac,
			armorbonus: armorbonus,
			armorsizemod: armorsizemod,
			armormiscmod: armormiscmod,
			touchmiscmod: touchmiscmod,
			flatfootedmiscmod: flatfootedmiscmod,
			baseattackbonus: baseattackbonus,
			attacksizemod: attacksizemod,
			meleemiscmod: meleemiscmod,
			rangedmiscmod:rangedmiscmod,
			basefort: basefort,
			fortmiscmod: fortmiscmod,
			basereflex: basereflex,
			reflexmiscmod: reflexmiscmod,
			basewillmod: basewillmod,
			willmiscmod: willmiscmod,
			initiavemiscmod: initiavemiscmod,
			movementspeed: movementspeed,
			damagetaken: damagetaken
		})
	.returning('*')
  	.then(info => {	
  		res.json(info);
  	})
  	.catch(err => res.json(err))
})

// app 

const host = '0.0.0.0';
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
	res.json('found server');
})

app.listen(port, host, () => {
	console.log('app is running');
	console.log('app is updated');

	console.log(process.env.PORT);
})