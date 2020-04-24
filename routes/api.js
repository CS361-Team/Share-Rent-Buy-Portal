const express = require('express');
const router = express.Router();
const pool = require('../modules/dbcon').pool;

//Add new item API
router.post('/addNewItem', (req, res, next) => {
	var { name, description, price, phone, address, city, state, zip, lat, long } = req.body;
	if (!name || !description || !price || !phone || !address || !city || !state || !zip) {
		res.send({ error1: 'No fields should be empty.' });
		return;
	} else {
		pool.query(
			'INSERT INTO Items (itemName, itemDescription, itemPrice, itemPhone, itemAddress, itemCity, itemState, itemZip, itemLat, itemLong) VALUES (?,?,?,?,?,?,?,?,?,?)',
			[ name, description, price, phone, address, city, state, zip, lat, long ],
			(err, result) => {
				if (err) {
					res.send(err);
				}
				res.send('Success');
			}
		);
	}
});

//Search API
router.get('/search', (req, res) => {
	var lat = req.query.lat;
	var long = req.query.long;
	var item = req.query.search;
	pool.query(
		'SELECT *, ST_DISTANCE_SPHERE(POINT(?,?),POINT(itemLong,itemLat)) * .000621371192 as distance FROM Items WHERE ST_DISTANCE_SPHERE(POINT(?,?),POINT(itemLong,itemLat))* .000621371192 < 50 ORDER BY DISTANCE ASC LIMIT 1',
		[ long, lat, long, lat ],
		(err, result) => {
			if (!result) {
				res.send({ searchResult: null });
				return;
			}
			var itemInfo = result[0];
			pool.query(
				'SELECT *,ST_DISTANCE_SPHERE(POINT(?,?),POINT(itemLong,itemLat)) * .000621371192 as distanceFromSearch,ST_DISTANCE_SPHERE(POINT(?,?),POINT(itemLong,itemLat)) * .000621371192 as distanceItemToItem FROM Items WHERE ST_DISTANCE_SPHERE(POINT(?,?),POINT(itemLong,itemLat))* .000621371192 < 10 ORDER BY distanceFromSearch ASC',
				[ long, lat, itemInfo.itemLong, itemInfo.itemLat, itemInfo.itemLong, itemInfo.itemLat ],
				(err2, result2) => {
					if (!result2) {
						res.send({ searchResult: null });
						return;
					}
					res.send({ searchResult: result2 });
				}
			);
		}
	);
});

module.exports = router;
