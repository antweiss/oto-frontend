
/*
 * GET home page.
 */
var request = require('request');
require('dotenv').config();

function Poduct(name, price) {
  // always initialize all instance properties
  this.name = name;
  this.price = price; // default value
}

function getForwardedHeaders(req){
    var headers = {};

    var user_cookie = req.user_cookie;
    if (user_cookie) {
        headers['Cookie'] = 'user=' + user_cookie;
    }
    incoming_headers = [ 'x-request-id',
                         'x-b3-traceid',
                         'x-b3-spanid',
                         'x-b3-parentspanid',
                         'x-b3-sampled',
                         'x-b3-flags',
                         'x-ot-span-context'
    ]

    for (var ihdr of incoming_headers){
        var val = req.headers[ihdr];
        if (val){
            headers[ihdr] = val;
            console.log("incoming: "+ihdr+":"+val);
        }
    }
    return headers;
}

exports.index = function(req, res){
  prod_url = "http://" + process.env.PRODUCT_SERVICE_HOST + ":" + process.env.PRODUCT_SERVICE_PORT + "/product"
  order_url = "http://" + process.env.ORDER_SERVICE_HOST + ":" + process.env.ORDER_SERVICE_PORT + "/orders"

  console.log(prod_url)
  var products = []
  var orders = []
  var fwdHeaders = getForwardedHeaders(req);
  var options = {
    url: prod_url,
    headers: fwdHeaders
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200)
    {
        console.log(body)
        products = JSON.parse(body)._items
        request({ url: order_url,
            headers: fwdHeaders}, function (error, response, body) {
        if (!error && response.statusCode == 200)
        {
            console.log(body)
            res.render( 'index', {
                title : 'Orders',
                products : products,
                orders : JSON.parse(body)._embedded.orders
            });
        }})
    }})

};

exports.register = function ( req, res ){
    console.log(req.body);
    var fwdHeaders = getForwardedHeaders(req);
    prod_url = "http://" + process.env.PRODUCT_SERVICE_HOST + ":" + process.env.PRODUCT_SERVICE_PORT + "/product"
    request({ url: prod_url,
              headers: fwdHeaders,
              method: 'POST',
              json: {"name": req.body.Product_name, "price": req.body.price, "stock": 0 }}, res.redirect('/'))

};

exports.order = function ( req, res ){
    console.log(req.body);
    var prod_url = "http://" + process.env.PRODUCT_SERVICE_HOST + ":" + process.env.PRODUCT_SERVICE_PORT + "/product"
    console.log(prod_url)
    var fwdHeaders = getForwardedHeaders(req);
    var products = []
    var options = {
        url: prod_url,
        headers:fwdHeaders
    };
    request(options, function (error, response, body, products) {
        if (!error && response.statusCode == 200)
        {
            console.log(body);
            products = JSON.parse(body)._items;

            var prod_id = "";
            var total = 0;
            console.log("starting to iterate on prods");
            for (var prod of products) {
                console.log(prod.name);
                if ( prod.name == req.body.chosen )
                {
                    prod_id = prod._id;
                    total = prod.price * req.body.amount[0];
                    order_url = "http://" + process.env.ORDER_SERVICE_HOST + ":" + process.env.ORDER_SERVICE_PORT + "/orders"
                    console.log(prod_id + " amount" + req.body.amount[0] + " totalSum " + total);
                    request({ url: order_url,
                        headers:fwdHeaders,
                        method: 'POST',
                        json: {"productId": prod_id, "amount": req.body.amount[0], "totalSum": total }},
                               function(error, response, body){
                                   if (!error && response.statusCode == 200)
                                    {
                                        console.log(body);
                                         res.redirect('/')
                                    }
                                    else
                                    {
                                         console.log("error " + body);
                                         res.redirect('/')
                                    }})

                }
            }
        }
    })
};
