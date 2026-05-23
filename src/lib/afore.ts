function afore(tag: any, hear: any): any {
	if(!tag){ return }
	tag = tag.the;
	var tmp = tag.to;
	hear = tmp.on.on(tag.tag, hear);
	hear.to = tmp || hear.to;
	hear.back.to = hear.to;
	tag.last = hear.back;
	hear.back = tag;
	tag.to = hear;
	return hear;
}
if(typeof module !== "undefined"){ module.exports = afore }
