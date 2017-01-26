'use strict';

var express = require('express')
	,	request = require('request')
	,	bodyParser = require('body-parser')
	,	confing = require('./config.json');

const REQUEST_HEADERS = {
	"X-B-Token-Short": confing.token.short,
	"X-B-Token-Long": confing.token.long,
	'User-Agent': 'LOL',
	'Content-Type': 'application/json'
};

/* Express */
var app = express();
app.use(bodyParser.urlencoded( { extended: true } ));
app.listen(confing.port, () => { console.log(`Listening port ${confing.port}.`) });

app.post('/', function (req, res) {
	var secretCode = req.body.scode;

	if (secretCode !== confing.secret) res.send('!ERROR! invalid code\n');

	res.send('OK\n');

	getComments(false, false, (comments) => {
		var intID = setInterval(() => {
			if (comments.length) {
				let item = comments.shift();
				deleteComment(item.model_id, item.task_id);
			} else {
				clearInterval(intID);
			}
		}, 500);
	});
});
/* Express */




function getComments(last_id, comments, callback) {
	var comments = !comments ? [] : comments;

	let payload = {
		subject_id: 0,
		category_id: 998,
		schema: 'moderation.index'
	};

	if (last_id === 0) {
		callback(comments);
		return;
	}
	if (last_id) payload.last_id = last_id;

	let options = {
		url: 'https://znanija.com/api/27/moderation_new/get_comments_content',
		method: 'POST',
		headers: REQUEST_HEADERS,
		body: JSON.stringify(payload)
	};

	request(options, (e, httpRes, body) => {
		if (e) throw e;

		try {
			body = JSON.parse(body)
		} catch (e) {
			throw body;
		}

		if (!body.success) throw JSON.stringify(body);

	for (var i = body.data.items.length - 1; i >= 0; i--) {
		comments.push(body.data.items[i]);
	}

	getComments(body.data.last_id, comments, callback);
	});
}

function deleteComment(model_id, task_id) {
	let payload = JSON.stringify({
		model_id: model_id,
		model_type_id: 45,
		reason_id: 12,
		give_warning: false,
		reason: '',
		schema: '',
		_coupon_: ''
	});

	let options = {
		url: 'https://znanija.com/api/28/moderation_new/delete_comment_content',
		method: 'POST',
		headers: REQUEST_HEADERS,
		body: payload
	};

	request(options, (e, httpRes, body) => {
		if (e) throw e;

		try {
			body = JSON.parse(body)
		} catch (e) {
			throw body;
		}

		if (!body.success && body.exception_type === 173 && body.code === 5) return;
		if (!body.success) throw JSON.stringify(body);

		setTimeout(() => { closeTicket(task_id) }, 100);
	});
}

function closeTicket(task_id) {
	let payload = JSON.stringify({
		model_id: task_id,
		model_type_id: 1,
		schema: '',
		_coupon_: ''
	});

	let options = {
		url: 'https://znanija.com/api/28/moderate_tickets/expire',
		method: 'POST',
		headers: REQUEST_HEADERS,
		body: payload
	};

	request(options, (e, h, b) => {
		/* ... */
	});
}
