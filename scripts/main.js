/*
 *	dependencies:
 *	scripts/vivagraph.js
 *  https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
 */

(function( window ) {
	var graph = Viva.Graph.graph();
	var graphics
	var renderer
	var layout
	var animation = false
	
	var nodeSize = 24
	
	var VIEW_PARAM = {
		"nodeSize" : 15,
		"springLength" : 80,        // view layout setting
		"springCoeff" : 0.0028,     // same
		"gravity" : -22,           // same
		"theta" : 0.8,              // same
		"dragCoeff" : 0.02,         // same
		"timeStep" : 20,            // same
	}
	

	// for arrow link
	function arrowMarker() {
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
				
	//-- node display customization
	function showNode(node) {
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
		var geom = arrowMarker()
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
    var jHist = function(){}
	
	//exposed member functions of jMol
    jHist.prototype = {
        //constructor: jHist,
		init_display : function (gid){
			console.log(gid)
			graphics = Viva.Graph.View.svgGraphics(); 
			
			graphics.node(showNode).placeNode(placeNode).link(showLink).placeLink(placeLink);
			
			layout = Viva.Graph.Layout.forceDirected(graph, {
			   springLength : VIEW_PARAM['springLength'],
			   springCoeff : VIEW_PARAM['springCoeff'],
			   dragCoeff : VIEW_PARAM['dragCoeff'],
			   gravity : VIEW_PARAM['gravity']
			});
		
			let domObj = window.document.body
			if (gid != undefined) {
				domObj = document.getElementById(gid)
			}
			renderer = Viva.Graph.View.renderer(graph, {
					layout    : layout,
					graphics  : graphics,
					container : domObj
			});
		
			renderer.run();
			animation = true
			//renderer.pause()
		},
		
		addNodes : function addNodes(nodes) {
				for  (let n=0; n<nodes.length; n++) {
					let node = nodes[n]
					graph.addNode(node.id, node)
				}
			},
			
		addLinks : function (links) {
			for (let n=0; n<links.length; n++) {
				let link = links[n]
				if (link.type != 'noshow') {
					graph.addLink(link.from, link.to, link)
				}
			}
		},
		
		grephics : function(){ return graphics},
		graph : function() { return graph},
		renderer : function(){ return renderer},
		layout : function() { return layout},
		
		isrunning : function() { return animation; },
		pause : function() { animation = false; renderer.pause(); },
		resume : function() { animation = true; renderer.resume(); }
	}
	
    // Create a jMol object and put it i global scope
    return (window.jHist = new jHist());

})(window)

	

