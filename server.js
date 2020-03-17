const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');

const app = express();
app.use(bodyParser.json());
app.use(cors());


const knex = require('knex')({
	client: 'pg',
	connection: {
    	connectionString : String(process.env.DATABASE_URL) + 'sslmode=disable',
    	ssl: true
  	}
});



// account management

app.post('/register', (req, res) => {
	const {name, email, password} = req.body;
	const user_id = uuidv4();

	const salt = bcrypt.genSaltSync(10);
	const hash = bcrypt.hashSync(password, salt);	

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

	knex.select('*')
  	.from('users')
  	.where({email: email})
  	.then(user => {
  		console.log(user);
  		if (user.length)
  		{
  			console.log(user);
  		  	const isValid = bcrypt.compareSync(password, user[0].hash);
  		  	if (isValid)
  		  	res.json(user[0]);
  		  	else 
  		  		throw 'password not valid'
  		}
  		else
  		throw 'username not valid'
  	})
  	.catch(err => res.json(err))
})

// data management 
// create a blank character 
app.post('/newhero', (req, res) => {
	const {user_id, name} = req.body;
	const hero_id = uuidv4();

	knex('heroes')
	.insert({user_id: user_id, name: name, hero_id: hero_id})
  	.then(() => {	
  		knex('info')
		.insert({name: name, hero_id: hero_id})
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
  		knex('info')
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
	knex('info').select('*')
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
  	.catch(err => res.json(err))
})

// update info on a character
app.post('/hero_info', (req, res) => {
	const {hero_id, name, player, race, heroclass, alignment, deity, level, size, age, gender, height, weight, eyes, hair, herocolor, looks, about} = req.body;

	knex('info')
	.where({hero_id: hero_id})
	.update({
			player: player, 
			name: name,
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
  	.catch(err => res.json(err))
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
		casterlevel,
		fort,
		reflex,
		will,
		hp,
		ac,
		touch,
		cmd,
		armortype,
		speed,
		initiative,
		melee,
		cmb,
		ranged		
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
			casterlevel: casterlevel,
			fort: fort,
			reflex: reflex,
			will: will,
			hp: hp,
			ac: ac,
			touch: touch,
			cmd: cmd,
			armortype: armortype,
			speed: speed,
			initiative: initiative,
			melee: melee,
			cmb: cmb,
			ranged: ranged
		})
	.returning('*')
  	.then(info => {	
  		res.json(info);
  	})
  	.catch(err => res.json(err))
})

// app 
app.listen(process.env.PORT, () => {
	console.log('app is running');
	console.log(process.env.PORT);
})