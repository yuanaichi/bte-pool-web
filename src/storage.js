// 页面存储
var STORAGE = {};

STORAGE = {

	setItem: function (key, data) {
		if (window.localStorage) {
		    localStorage.setItem(key, JSON.stringify(data));
		}
	},
	getItem: function(key) {
		var d = window.localStorage? localStorage.getItem(key): null;
		if(d){
			return JSON.parse(d);
		}else{
			return '';
		}
	},
	removeItem: function(key) {
		if (window.localStorage) {
		    localStorage.removeItem(key);
		}
	}
}

export default STORAGE
