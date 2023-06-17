const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const calendar = require("./generateCalendar");
const path = require('path');
const fs = require('fs');

const connection = mysql.createConnection({
	host     : 'host name',
	user     : 'user name',
	password : 'password',
	database : 'database name'
});



const app = express();

app.set('view engine', 'ejs');



app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));


app.use('/images', express.static('images'));
app.use('/js', express.static('js'));

app.get('/', function(request, response) {
	if (request.session.loggedin) {
		response.redirect('/calendar');
	}
	else {
		response.redirect('/login');
	}
});




app.get('/login', function(request, response) {
	response.sendFile(path.join(__dirname + '/views/login.html'));
});

app.get('/signup', function(request, response) {
	response.sendFile(path.join(__dirname + '/views/signup.html'));
});



app.post('/auth', function(request, response) {
	let userid;
	let username = request.body.username;
	let password = request.body.password;
	let email;
	let nickname;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (error) throw error;
			if(results.length > 0) {
				userid = results[0].id;
				console.log("user id is ", userid);
				email = results[0].email;
				nickname = results[0].nickname;
				request.session.loggedin = true;
				request.session.userid = userid;
				request.session.username = username;
				request.session.email = email;
				request.session.nickname = nickname;
				request.session.subscribed = new Array(0)
				let temp = results[0].subscribed.split(',');

				connection.query('SELECT * FROM channels WHERE name IN (?)', [temp], function(error, results, fields) {
					if (error) throw error;
					for (let i = 0; i < results.length; i++) {
						let ch = {};
						ch.name = results[i].name;
						ch.description = results[i].description;
						ch.invcode = results[i].invcode;
						ch.membercount = results[i].membercount;
						ch.owner = results[i].owner;
						ch.color = results[i].color;
						request.session.subscribed.push(ch);
					}
					return response.redirect('/calendar');
				});
			}		
			else {
				response.write("<script>alert('Incorrect Username and/or Password!')</script>");
				response.write("<script>window.location=\"../login\"</script>");
				return;
			}			
		});
	} else {
		response.write("<script>alert('Please enter Username and Password!')</script>");
		response.write("<script>window.location=\"../login\"</script>");
		return;
	}
});

app.post('/reg', function(request, response) {
	let userid;
	let username = request.body.username;
	let nickname = request.body.nickname;
	let email = request.body.email;
	let password = request.body.password;
	let original;
	original = username;
	username = username.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|~|!|@|#|$|%|^|&|*|(|)|_|+|<|>|?|:|{|}|/]/g, "");
	if(original != username) {
		response.write("<script>alert('Username contains invalid characters!')</script>");
		response.write("<script>window.location=\"../signup\"</script>");
		return;
	}
	original = nickname;
	nickname = nickname.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|\s|~|!|@|#|$|%|^|&|*|(|)|_|+|<|>|?|:|{|}|/]/g, "");
	if(original != nickname) {
		response.write("<script>alert('Nickname contains invalid characters!')</script>");
		response.write("<script>window.location=\"../signup\"</script>");
		return;
	}
	email = email.replace(/[^a-z|A-Z|0-9|@|.|_]/g, "");
	original = password;
	password = password.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|~|!|@|#|$|%|^|&|*|(|)|_|+|<|>|?|:|{|}|/]/g, "");
	if(original != password) {
		response.write("<script>alert('Password contains invalid characters!')</script>");
		response.write("<script>window.location=\"../signup\"</script>");
		return;
	}
	if(username.length < 3) {
		response.write("<script>alert('Username must be 3 or more characters!')</script>");
		response.write("<script>window.location=\"../signup\"</script>");
		return;
	}
	if(nickname.length < 3) {
		response.write("<script>alert('Nickname must be 3 or more characters!')</script>");
		response.write("<script>window.location=\"../signup\"</script>");
		return;
	}
	if(email.length < 4) {
		response.write("<script>alert('Email must be 4 or more characters!')</script>");
		response.write("<script>window.location=\"../signup\"</script>");
		return;
	}
	if(email.indexOf("@") == -1 || email.indexOf(".") == -1 || email.indexOf("@") > email.indexOf(".") || email.indexOf("@") == 0 || email.indexOf(".") == 0 || email.indexOf("@") == email.length - 1 || email.indexOf(".") == email.length - 1) {
		response.write("<script>alert('Invalid email!')</script>");
		response.write("<script>window.location=\"../signup\"</script>");
		return;
	}
	if(password.length < 8) {
		response.write("<script>alert('Password must be 8 or more characters!')</script>");
		response.write("<script>window.location=\"../signup\"</script>");
		return;
	}
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ?', [username], function(error, results, fields) {
			if (error) throw error;
			if(results.length > 0) {
				response.write("<script>alert('ID already exists!')</script>");
				response.write("<script>window.location=\"../signup\"</script>");
			}
			else {
				connection.query('INSERT INTO accounts (username, nickname, password, email, subscribed) VALUES (?, ?, ?, ?, ?);', [username, nickname, password, email, "Personal channel for " + username], function(error, results, fields) {
					if (error) throw error;
					connection.query('INSERT INTO channels (name, description, private, personal, invcode, membercount, owner, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', ["Personal channel for " + username, "Personal channel for " + username, 1, 1, "personal_invcode_top_secret", 1, username, "#000000"], function(error, results, fields) {
						if (error) throw error;
					});
					connection.query('SELECT * FROM accounts WHERE username = ?', [username], function(error, results, fields) {
						if (error) throw error;
						response.redirect('/login');
					});
				});
			}
		});
	} else {
		response.write("<script>alert('Please enter Username and Password!')</script>");
		response.write("<script>window.location=\"../signup\"</script>");
		return;
	}
});

app.get('/account', function(request, response) {
	if (request.session.loggedin) {
		response.render('account',{
            username:request.session.username,
			nickname:request.session.nickname,
			email:request.session.email
        })
	} else {
		response.redirect('/login');
	}
});

app.post('/account/confirm', function(request, response) {
	let nickname = request.body.nickname;
	let email = request.body.email;
	let original;
	original = nickname;
	nickname = nickname.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|\s|~|!|@|#|$|%|^|&|*|(|)|_|+|<|>|?|:|{|}|/]/g, "");
	if(original != nickname) {
		response.write("<script>alert('Nickname contains invalid characters!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	original = email;
	email = email.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|~|!|@|#|$|%|^|&|*|(|)|_|+|<|>|?|:|{|}|/]/g, "");
	if(original != email) {
		response.write("<script>alert('Email contains invalid characters!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	if(nickname.length < 4) {
		response.write("<script>alert('Nickname must be 4 or more characters!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	if(email.length < 4) {
		response.write("<script>alert('Email must be 4 or more characters!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	if(email.indexOf("@") == -1 || email.indexOf(".") == -1 || email.indexOf("@") > email.indexOf(".") || email.indexOf("@") == 0 || email.indexOf(".") == 0 || email.indexOf("@") == email.length - 1 || email.indexOf(".") == email.length - 1) {
		response.write("<script>alert('Invalid email!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	connection.query('UPDATE accounts SET nickname = ?, email = ? WHERE id = ?', [nickname, email, request.session.userid], function(error, results, fields) {
		if (error) throw error;
		request.session.nickname = nickname;
		request.session.email = email;
		response.redirect('/account');
	}
	);
});

app.post('/account/pwconfirm', function(request, response) {
	let currpw = request.body.currpw;
	let newpw = request.body.newpw;
	let confirmpw = request.body.confirmpw;
	let original;
	original = currpw;
	currpw = currpw.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|~|!|@|#|$|%|^|&|*|(|)|_|+|<|>|?|:|{|}|/]/g, "");
	if(original != currpw) {
		response.write("<script>alert('Password contains invalid characters!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	original = newpw;
	newpw = newpw.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|~|!|@|#|$|%|^|&|*|(|)|_|+|<|>|?|:|{|}|/]/g, "");
	if(original != newpw) {
		response.write("<script>alert('Password contains invalid characters!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	original = confirmpw;
	confirmpw = confirmpw.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|~|!|@|#|$|%|^|&|*|(|)|_|+|<|>|?|:|{|}|/]/g, "");
	if(original != confirmpw) {
		response.write("<script>alert('Password contains invalid characters!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	if (newpw != confirmpw) {
		response.write("<script>alert('Passwords do not match!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	else if(newpw.length < 8) {
		response.write("<script>alert('Password must be 8 or more characters!')</script>");
		response.write("<script>window.location=\"../account\"</script>");
		return;
	}
	else {
		connection.query('SELECT * FROM accounts WHERE id = ? AND password = ?', [request.session.userid, currpw], function(error, results, fields) {
			if (error) throw error;
			if(results.length > 0) {
				connection.query('UPDATE accounts SET password = ? WHERE id = ?', [newpw, request.session.userid], function(error, results, fields) {
					if (error) throw error;
					response.redirect('/account');
				});
			}
			else {
				response.write("<script>alert('Incorrect Password!')</script>");
				response.write("<script>window.location=\"../account\"</script>");
				return;
			}		
		});
	}
});


app.get('/channel', function(request, response) {
	if (request.session.loggedin) {
		connection.query('SELECT * FROM channels WHERE private=false', [], function(error, results, fields) {
			if (error) throw error;
			notsublist = [];
			for (let i = 0; i < results.length; i++) {
				if (!request.session.subscribed.map(function(a) {return a.name;}).includes(results[i].name)) {
					let plan = {};
					plan.name = results[i].name;
					plan.description = results[i].description;
					plan.invcode = results[i].invcode;
					plan.membercount = results[i].membercount;
					plan.owner = results[i].owner;
					notsublist.push(plan);	
				}
			}
			connection.query('SELECT * FROM channels WHERE name IN (?)', [request.session.subscribed.map(function(a) {return a.name;})], function(error, results, fields) {
				if (error) {
					request.session.subscribed = [];
				}
				else {
					request.session.subscribed = results;
				}
				response.render('channel',{
					username:request.session.username,
					nickname:request.session.nickname,
					subscribed:request.session.subscribed,
					notsublist:notsublist
				})
			});
		});
	} else {
		response.redirect('/login');
	}
});

app.get('/channel/add', function(request, response) {
	if (request.session.loggedin) {
		response.render('addchannel',{
            username:request.session.username,
			nickname:request.session.nickname,
			email:request.session.email
        })
	} else {
		response.redirect('/login');
	}
});

app.post('/channel/confirm', function(request, response) {
	let b = request.body;
	let boxes = [];
	for (let key in b) {
		if(b[key] == 'on') {
			boxes.push(key);
		}
	}
	for(let i = 0; i < request.session.subscribed.length; i++) {
		connection.query('UPDATE channels SET membercount = membercount - 1 WHERE name = ?', [request.session.subscribed[i].name], function(error, results, fields) {
			if (error) throw error;
		});
	}
	request.session.subscribed = Array(0);
	if(boxes.length == 0) {
		connection.query('UPDATE accounts SET subscribed = ? WHERE id = ?', ["", request.session.userid], function(error, results, fields) {
			if (error) throw error;
		});
		return response.redirect('/channel');
	}

	connection.query('SELECT * FROM channels WHERE name IN (?)', [boxes], function(error, results, fields) {
		if (error) throw error;
		for (let i = 0; i < results.length; i++) {
			let ch = {};
			ch.name = results[i].name;
			ch.description = results[i].description;
			ch.invcode = results[i].invcode;
			ch.membercount = results[i].membercount + 1;
			ch.owner = results[i].owner;
			ch.color = results[i].color;
			request.session.subscribed.push(ch);
			connection.query('UPDATE channels SET membercount = membercount + 1 WHERE name = ?', [ch.name], function(error, results, fields) {
				if (error) throw error;
			});
		}
		connection.query('UPDATE accounts SET subscribed = ? WHERE id = ?', [request.session.subscribed.map(function(a) {return a.name;}).join(','), request.session.userid], function(error, results, fields) {
			if (error) throw error;
		});
		request.session.subscribed = request.session.subscribed.filter(function (el) {
			return el.name != "";
		});
		
		return response.redirect('/channel');
	});
});

app.post('/channel/add/confirm', function(request, response) {
	let channelname = request.body.channelname
	let description = request.body.description
	let original;
	original = channelname;
	console.log(channelname);
	channelname = channelname.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|\s|,|~|!|@|#|$|%|^|&|*|(|)|_|+|\-|<|>|?|:|.|{|}|/]/g, "");
	console.log(channelname);
	if(original != channelname) {
		response.write("<script>alert('Channel name can only contain alphabets, numbers, and some special characters!')</script>");
		response.write("<script>window.location=\"../add\"</script>");
		return;
	}
	if(channelname.startsWith("Personal channel")) {
		response.write("<script>alert('Channel name cannot start with \"Personal channel\"!')</script>");
		response.write("<script>window.location=\"../add\"</script>");
		return;
	}

	original = description;
	description = description.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|\s|,|~|!|@|#|$|%|^|&|*|(|)|_|+|\-|<|>|?|:|.|{|}|/]/g, "");
	if(original != description) {
		response.write("<script>alert('Description can only contain alphabets, numbers, and some special characters!')</script>");
		response.write("<script>window.location=\"../add\"</script>");
		return;
	}

	if(channelname.length < 1) {
		response.write("<script>alert('Channel name must be 1 or more characters!')</script>");
		response.write("<script>window.location=\"../add\"</script>");
		return;
	}
	if(description.length < 1) {
		description = "No description";
	}
	
	let isprivate = (request.body.private == "private");
	let color = request.body.color
	let invcode = "";
	connection.query('SELECT * FROM channels WHERE name = ?', [channelname], function(error, results, fields) {
		if (error) throw error;
		if(results.length > 0) {
			response.write("<script>alert('Channel name already exists!')</script>");
			response.write("<script>window.location=\"../add\"</script>");
			return;
		}
		else {
			invcode = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
			
			connection.query('INSERT INTO channels (name, description, owner, private, membercount, color, invcode) VALUES (?, ?, ?, ?, ?, ?, ?);', [channelname, description, request.session.nickname, isprivate, 1, color, invcode], function(error, results, fields) {
				if (error) throw error;
			});
			let ch = {};
			connection.query('SELECT * FROM channels WHERE name = ?', [channelname], function(error, results, fields) {
				if (error) throw error;
				ch.name = results[0].name;
				ch.description = results[0].description;
				ch.invcode = results[0].invcode;
				ch.membercount = results[0].membercount;
				ch.owner = results[0].owner;
				ch.color = results[0].color;
				request.session.subscribed.push(ch);
				request.session.subscribed = request.session.subscribed.filter(function (el) {
					return el.name != "";
				});
				connection.query('UPDATE accounts SET subscribed = ? WHERE id = ?', [request.session.subscribed.map(function(a) {return a.name;}).join(','), request.session.userid], function(error, results, fields) {
					if (error) throw error;
				});
				return response.redirect('/channel');
			});
		}
	});
});


app.get('/redeem', function(request, response) {
	if (request.session.loggedin) {
		response.render('redeem',{
            username:request.session.username,
			nickname:request.session.nickname,
			email:request.session.email
        })
	} else {
		response.redirect('/login');
	}
});

app.post('/redeem/confirm', function(request, response) {
	let invcode = request.body.invcode;
	connection.query('SELECT * FROM channels WHERE invcode = ?', [invcode], function(error, results, fields) {
		if (error) throw error;
		if(results.length > 0) {
			let ch = {};
			ch.name = results[0].name;
			
			if(request.session.subscribed.filter(function (el) {
				return el.name == ch.name;
			}).length > 0) {
				response.write("<script>alert('You are already subscribed to this channel!')</script>");
				response.write("<script>window.location=\"../redeem\"</script>");
				return;
			}
			ch.description = results[0].description;
			ch.invcode = results[0].invcode;
			ch.membercount = results[0].membercount + 1;
			ch.owner = results[0].owner;
			ch.color = results[0].color;
			request.session.subscribed.push(ch);
			request.session.subscribed = request.session.subscribed.filter(function (el) {
				return el.name != "";
			});
			connection.query('UPDATE accounts SET subscribed = ? WHERE id = ?', [request.session.subscribed.map(function(a) {return a.name;}).join(','), request.session.userid], function(error, results, fields) {
				if (error) throw error;
			});
			connection.query('UPDATE channels SET membercount = membercount + 1 WHERE name = ?', [ch.name], function(error, results, fields) {
				if (error) throw error;
			});
			return response.redirect('/channel');
		}
		else {
			response.write("<script>alert('Invalid Code!')</script>");
			response.write("<script>window.location=\"../redeem\"</script>");
			return;
		}
	});
});

app.get('/logout', function(request, response) {
	request.session.loggedin = false;
	response.redirect('/login');
});

app.get('/calendar', function(request, response) {
	if (request.session.loggedin) {
		if(!(1 <= request.query.month && request.query.month <= 12)) {
			request.query.month = new Date().getMonth() + 1;
		}
		const year = request.query.year || 2023;
		const month = request.query.month || new Date().getMonth() + 1;
		if(year > 3000 || year < 0) {
			response.write("<script>alert('Invalid year!')</script>");
			response.write("<script>window.location=\"../calendar\"</script>");
			return;
		}
		if(month > 12 || month < 1) {
			response.write("<script>alert('Invalid month!')</script>");
			response.write("<script>window.location=\"../calendar\"</script>");
			return;
		}
		const months = ["January", "February", "March", "April", "May", "June", "July",
		"August", "September", "October", "November", "December"];
		connection.query('SELECT * FROM events WHERE year = ? AND month = ?', [year, month], function(error, results, fields) {
			if (error) throw error;
			results = results.filter(function (el) {
				return el.name != "";
			});
			let eventlist = [];
			for (let i = 0; i < results.length; i++) {
				if(request.session.subscribed.filter(function (el) {
					return el.name == results[i].channel;
				}).length == 0) {
					continue;
				}
				let plan = {};
				plan.eid = results[i].eid;
				plan.name = results[i].name;
				plan.description = results[i].description;
				plan.channel = results[i].channel;
				plan.year = results[i].year;
				plan.month = results[i].month;
				plan.day = results[i].day;
				plan.owner = results[i].owner;
				plan.color = request.session.subscribed.filter(function (el) {
					return el.name == plan.channel;
				})[0].color;
				eventlist.push(plan);
			}
			response.render("calendar",{
				subscribed:request.session.subscribed,
				calendar: calendar(year, month, eventlist),
				username:request.session.username,
				nickname:request.session.nickname,
				months, year, month,
				daynames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
				today: new Date().getDate(),
				todaymonth: new Date().getMonth() + 1,
				todayyear: new Date().getFullYear(),
				todayweekday: new Date().getDay(),
			});
		});
	} else {
		response.redirect('/login');
	}
});

app.get('/calendar/addevent', function(request, response) {
	if (request.session.loggedin) {
		if(request.session.subscribed.length == 0) {
			response.write("<script>alert('You are not subscribed to any channels!')</script>");
			response.write("<script>window.location=\"../calendar\"</script>");
			return;
		}
		const year = request.query.year || 2023;
		const month = request.query.month || 5;
		const date = request.query.date || 1;
		if(year > 3000 || year < 0) {
			response.write("<script>alert('Invalid year!')</script>");
			response.write("<script>window.location=\"../calendar\"</script>");
			return;
		}
		if(month > 12 || month < 1) {
			response.write("<script>alert('Invalid month!')</script>");
			response.write("<script>window.location=\"../calendar\"</script>");
			return;
		}
		if(date > 31 || date < 1) {
			response.write("<script>alert('Invalid date!')</script>");
			response.write("<script>window.location=\"../calendar\"</script>");
			return;
		}
		const months = ["January", "February", "March", "April", "May", "June", "July",
		"August", "September", "October", "November", "December"];
		response.render("addevent",{subscribed:request.session.subscribed, username:request.session.username, nickname:request.session.nickname, months,year, date, month});
	} else {
		response.redirect('/login');
	}
});

app.post('/calendar/addevent/confirm', function(request, response) {
	let eventname = request.body.eventname;
	let eventdesc = request.body.eventdesc;
	let original;

	original = eventname;
	eventname = eventname.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|\s|,|~|!|@|#|$|%|^|&|*|(|)|_|+|\-|<|>|?|:|.|{|}|/]/g, "");
	if(original != eventname) {
		response.write("<script>alert('Event name contains invalid characters!')</script>");
		response.write("<script>window.location=\"../addevent\"</script>");
		return;
	}
	original = eventdesc;
	eventdesc = eventdesc.replace(/[^a-z|A-Z|0-9|ㄱ-ㅎ|가-힣|\s|,|~|!|@|#|$|%|^|&|*|(|)|_|+|\-|<|>|?|:|.|{|}|/]/g, "");
	if(original != eventdesc) {
		response.write("<script>alert('Description contains invalid characters!')</script>");
		response.write("<script>window.location=\"../addevent\"</script>");
		return;
	}

	if(eventname.length < 1) {
		response.write("<script>alert('Event name must be 1 or more characters!')</script>");
		response.write("<script>window.location=\"../addevent\"</script>");
		return;
	}
	if(eventdesc.length < 1) {
		eventdesc = "No description";
	}
	let eventchannel = request.body.eventchannel;
	let year = request.body.year;
	let month = request.body.month;
	let day = request.body.date;
	connection.query('INSERT INTO events (name, description, channel, year, month, day, owner) VALUES (?, ?, ?, ?, ?, ?, ?);', [eventname, eventdesc, eventchannel, year, month, day, request.session.nickname], function(error, results, fields) {
		if (error) throw error;
		response.redirect('/calendar');
	});
});

app.post('/calendar/deleteevent', function(request, response) {
	let eid = request.body.eid;
	connection.query('SELECT * FROM events WHERE eid = ?', [eid], function(error, results, fields) {
		if (error) throw error;
		if(results.length > 0) {
			connection.query('SELECT * FROM channels WHERE name = ?', [results[0].channel], function(error, chaninfo, fields) {
				if (error) throw error;
				if(results[0].owner != request.session.nickname && chaninfo[0].owner != request.session.nickname) {
					response.write("<script>alert('You are not the owner of this event or channel!')</script>");
					response.write("<script>window.location=\"../calendar\"</script>");
					return;
				}
				connection.query('DELETE FROM events WHERE eid = ?', [eid], function(error, results, fields) {
					if (error) throw error;
					response.redirect('/calendar');
				});
			});
		}
		else {
			response.write("<script>alert('Invalid Event ID!')</script>");
			response.write("<script>window.location=\"../calendar\"</script>");
			return;
		}
	});
});


app.listen(3000);