declare var require: any;

import { Gun } from '../gun/root.js';

module.exports = function(req: any, cb: any){
	if(!req.url || !req.url.query || !req.url.query.jsonp){ return cb }
	cb.jsonp = req.url.query.jsonp;
	delete req.url.query.jsonp;
	(Gun as any).obj.map((Gun as any).obj.ify(req.url.query['`']), function(val: any, i: any){
		req.headers[i] = val;
	});
	delete req.url.query['`'];
	if(req.url.query.$){
		req.body = req.url.query.$;
		if(!(Gun as any).obj.has(req.url.query, '^') || 'json' == req.url.query['^']){
			req.body = (Gun as any).obj.ify(req.body);
		}
	}
	delete req.url.query.$;
	delete req.url.query['^'];
	delete req.url.query['%'];
	var reply: any = {headers:{}};
	return function(res: any){
		if(!res){ return }
		if(res.headers){
			(Gun as any).obj.map(res.headers, function(val: any, field: any){
				reply.headers[field] = val;
			});
		}
		reply.headers['Content-Type'] = "text/javascript";
		if((Gun as any).obj.has(res,'chunk') && (!reply.body || (Gun as any).list.is(reply.chunks))){
			(reply.chunks = reply.chunks || []).push(res.chunk);
		}
		if((Gun as any).obj.has(res,'body')){
			reply.body = res.body;
			reply.body = ';'+ cb.jsonp + '(' + (Gun as any).text.ify(reply) + ');';
			cb(reply);
		}
	}
}
