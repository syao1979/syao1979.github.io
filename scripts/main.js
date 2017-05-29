/*
 *	dependencies:
 *	scripts/vivagraph.js
 *  https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
 */

(function( window ) {
	var geom
	var nodeSize = 24

	// for arrow link
	function arrowMarker(graphics) {
		var createMarker = function(id) {
			return Viva.Graph.svg('marker')
					   .attr('id', id)
					   .attr('viewBox', "0 0 10 10")
					   .attr('refX', "10")
					   .attr('refY', "5")
					   .attr('markerUnits', "strokeWidth")
					   .attr('markerWidth', "10")
					   .attr('markerHeight', "5")
					   .attr('orient', "auto");
		},
	
		marker = createMarker('Triangle');
		marker.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z');
		
		// Marker should be defined only once in <defs> child element of root <svg> element:
		var defs = graphics.getSvgRoot().append('defs');
		defs.append(marker);
	
		return Viva.Graph.geom();
	}
	
	function mouseDownOnNode(node) {
		console.log("mouseDownOnNode : " + node.id)
	}
					
	//-- node customization
	var callbacks = {};
	function nodeBehave(node) {
		let imgURL = '/images/man.png'
		if (node.data.type == "di-wang") {
			if (node.data.gender == 'f') {
				imgURL = '/images/nv-wang.png'
			} else {
				imgURL = '/images/di-wang.png'
			}
		} else {
			if (node.data.gender == 'f') {
				imgURL = '/images/woman.png'
			}
		}
		
		if (node.data.image && node.data.image != "") {
			imgURL = node.data.image
		}
		
		// This time it's a group of elements: http://www.w3.org/TR/SVG/struct.html#Groups
		var ntxt = node.data.id
		if (node.data.name) {
			ntxt = node.data.name
		}
		var ui = Viva.Graph.svg('g'), // Create SVG text element with user name as content
			svgText = Viva.Graph.svg('text').attr('y', '-4px').text(ntxt),
			img = Viva.Graph.svg('image').attr('width', nodeSize).attr('height', nodeSize).link(imgURL);

		ui.append(svgText);
		ui.append(img);
		
		// mouse hover and leave event 
		//$(ui).hover(function() { // mouse over
		//	console.log('hover node ' + node.id);
		//}, function() { // mouse out
		//	console.log('mouse out node ' + node.id);
		//})
		
		// go through registered callbacks
		Object.keys(callbacks).forEach(
			function(callbacktype) {
				ui.addEventListener(callbacktype, function(e) {
					callbacks[callbacktype](node, e)
				}
				);
			}
		)
		return ui;
	}
	
	
	function placeNode(nodeUI, pos){
		nodeUI.attr('transform','translate(' + (pos.x - nodeSize/2) + ',' + (pos.y - nodeSize/2) +')');
	}
	
	//-- link display customization
	function showLink(link){
		switch (link.data.relation) {
			case 'wife' : return Viva.Graph.svg('path').attr('stroke', 'red')
			case 'son'	: 	return Viva.Graph.svg('path')
						   .attr('stroke', 'gray')
						   .attr('marker-end', 'url(#Triangle)');
			case 'her-son' : return;	// do not draw link
			default : return Viva.Graph.svg('path').attr('stroke', 'gray')
		}
		
		//return Viva.Graph.svg('path').attr('stroke', '')
		//						return Viva.Graph.svg('path')
		//                           .attr('stroke', 'red')
		//                           .attr('stroke-dasharray', '5, 5');
	}
	
	function placeLink(linkUI, fromPos, toPos) {
		var toNodeSize = nodeSize,
			fromNodeSize = nodeSize;
		
		var from = geom.intersectRect(
				// rectangle:
						fromPos.x - fromNodeSize / 2, // left
						fromPos.y - fromNodeSize / 2, // top
						fromPos.x + fromNodeSize / 2, // right
						fromPos.y + fromNodeSize / 2, // bottom
				// segment:
						fromPos.x, fromPos.y, toPos.x, toPos.y)
				   || fromPos; // if no intersection found - return center of the node

		var to = geom.intersectRect(
				// rectangle:
						toPos.x - toNodeSize / 2, // left
						toPos.y - toNodeSize / 2, // top
						toPos.x + toNodeSize / 2, // right
						toPos.y + toNodeSize / 2, // bottom
				// segment:
						toPos.x, toPos.y, fromPos.x, fromPos.y)
					|| toPos; // if no intersection found - return center of the node

		var data = 'M' + from.x + ',' + from.y +
				   'L' + to.x + ',' + to.y;

		linkUI.attr("d", data);
	}
	
	//-- the main jHist class
    var jHist = function(){
		this.graph = Viva.Graph.graph()
		this.animation = false
		
		this.VIEW_PARAM = {
			"nodeSize" : 15,
			"springLength" : 80,        // view layout setting
			"springCoeff" : 0.0028,     // same
			"gravity" : -22,           // same
			"theta" : 0.8,              // same
			"dragCoeff" : 0.02,         // same
			"timeStep" : 20,            // same
		}
	}
	
	//exposed member functions of jMol
    jHist.prototype = {
        //constructor: jHist,
		init_display : function (gid){
			console.log(gid)
			this.graphics = Viva.Graph.View.svgGraphics();
			
			geom = arrowMarker(this.graphics)
			
			this.graphics.node(nodeBehave).placeNode(placeNode).link(showLink).placeLink(placeLink);
			
			this.layout = Viva.Graph.Layout.forceDirected(this.graph, {
			   springLength : this.VIEW_PARAM['springLength'],
			   springCoeff : this.VIEW_PARAM['springCoeff'],
			   dragCoeff : this.VIEW_PARAM['dragCoeff'],
			   gravity : this.VIEW_PARAM['gravity']
			});
		
			let domObj = window.document.body
			if (gid != undefined) {
				domObj = document.getElementById(gid)
			}
			this.renderer = Viva.Graph.View.renderer(this.graph, {
					layout    : this.layout,
					graphics  : this.graphics,
					container : domObj
			});
		
			this.renderer.run();
			this.animation = true
			//this.renderer.pause()
		},
		
		addNodes : function addNodes(nodes) {
				for  (let n=0; n<nodes.length; n++) {
					let node = nodes[n]
					this.graph.addNode(node.id, node)
				}
			},
			
		addLinks : function (links) {
			for (let n=0; n<links.length; n++) {
				let link = links[n]
				if (link.type != 'noshow') {
					this.graph.addLink(link.from, link.to, link)
				}
			}
		},
		
		toJSON : function(){
			let nodes = []
			let links = []
			this.graph.forEachNode(function(node){
				nodes.push(node.data)
			})
			this.graph.forEachLink(function(link){
				links.push(link.data)
			})
			return {"nodes" : nodes, "links": links}
		},
		
		
		isrunning : function() { return this.animation; },
		pause : function() { this.animation = false; this.renderer.pause(); },
		resume : function() { this.animation = true; this.renderer.resume(); },
		
		getNode : function(nid){ return },
		setCallback : function(callbacktype, f){ callbacks[callbacktype] = f },
	}
	
    // Create a jMol object and put it i global scope
    return (window.jHist = new jHist());

})(window)

	

