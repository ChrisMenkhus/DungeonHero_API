const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const knex = require('knex')({
	client: 'pg',
	connection: {
		host: 'localhost',
		user: 'postgres',
		password: '3p1d3m1c',
		database: 'dungeonhero'
	}
});
const app = express();
app.use(bodyParser.json());
app.use(cors());


// account management

app.post('/register', (req, res) => {
	const {name, email, password} = req.body;
	const user_id = uuidv4();

	const salt = bcrypt.genSaltSync(10);
	const hash = bcrypt.hashSync(password, salt);	

	knex('users')
	.insert({user_id: user_id, name: name, email: email, hash: hash})
	.returning('*')
  	.then(user => {
  		res.json(user[0]);
  	})
})

app.post('/login', (req, res) => {
	const {email, password} = req.body;

	knex.select('*')
  	.from('users')
  	.where({email: email})
  	.then(user => {
  		if (user.length)
  		{
  			console.log(user);
  		  	const isValid = bcrypt.compareSync(password, user[0].hash);
  		  	if (isValid)
  		  	res.json(user[0].user_id);
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
	  	.then(info => {
	  		res.json(info);
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
	knex.select('*')
  	.from('info')
  	.where({hero_id: hero_id})
  	.then(hero => {
  		if (hero.length)
  		{
  		  	res.json(hero[0]);
  		}
  		else
  		throw 'user not valid'
  	})
  	.catch(err => res.json(err))
})

app.post('/hero_info', (req, res) => {
	const {hero_id, player, race} = req.body;

	knex('info')
	.where({hero_id: hero_id})
	.update({
			player: player, 
			race: race
		})
	.returning('*')
  	.then(info => {	
  		res.json(info);
  	})
  	.catch(err => res.json(err))
})

// app 

app.listen(3000, () => {
	console.log('app is running on port 3000');
})