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
		if (link.data.relation == 'her-son') {	// do not draw link
			return
		}
		
		var ui = Viva.Graph.svg('path')
		if(link.data.relation == 'wife') {
			ui.attr('stroke', 'pink').attr('stroke-dasharray', '2, 2')
		} else if (link.data.relation == 'son') {
			ui.attr('stroke', 'red').attr('stroke-dasharray', '2, 2').attr('marker-end', 'url(#Triangle)');
		} else if (link.data.type == "di2di") {
			ui.attr('stroke', 'blue').attr('linewidth', 20)
		} else {
			ui.attr('stroke', 'gray').attr('stroke-dasharray', '5, 5');
		}
		ui.attr('fill', 'none')
		ui.relation = link.data.relation	// remember for later use
		//return Viva.Graph.svg('path').attr('stroke', '')
		//						return Viva.Graph.svg('path')
		//                           .attr('stroke', 'red')
		//                           .attr('stroke-dasharray', '5, 5');
		//console.dir(ui)
		return ui
	}
	
	function placeLink(linkUI, fromPos, toPos) {
		var data = null
		//if (linkUI.link.data.relation  == 'son' || linkUI.link.data.relation  == 'daughter') {
		//	//arch edge
		//	let ry = 15;
		//	// using arc command: http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
		//	data = 'M' + fromPos.x + ',' + fromPos.y +
		//			   ' A 10,' + ry + ',-30,0,1,' + toPos.x + ',' + toPos.y;
		//} else {
			let toNodeSize = nodeSize,
				fromNodeSize = nodeSize;
			
			let from = geom.intersectRect(
					// rectangle:
							fromPos.x - fromNodeSize / 2, // left
							fromPos.y - fromNodeSize / 2, // top
							fromPos.x + fromNodeSize / 2, // right
							fromPos.y + fromNodeSize / 2, // bottom
					// segment:
							fromPos.x, fromPos.y, toPos.x, toPos.y)
					   || fromPos; // if no intersection found - return center of the node
	
			let to = geom.intersectRect(
					// rectangle:
							toPos.x - toNodeSize / 2, // left
							toPos.y - toNodeSize / 2, // top
							toPos.x + toNodeSize / 2, // right
							toPos.y + toNodeSize / 2, // bottom
					// segment:
							toPos.x, toPos.y, fromPos.x, fromPos.y)
						|| toPos; // if no intersection found - return center of the node
	
			
			data = 'M' + from.x + ',' + from.y +
					   'L' + to.x + ',' + to.y;
		//}

		if (data) {
			linkUI.attr("d", data);
		}
	}
	
	function desiredScale(layout, viewObj){
		var graphRect = layout.getGraphRect();
		var graphSize = Math.min(graphRect.x2 - graphRect.x1, graphRect.y2 - graphRect.y1);
		var screenSize = Math.min($(viewObj).width(), $(viewObj).height());
		//var scalefactor = 0.9 // practival observation tells we need to overshut a little
		return (screenSize / graphSize) * scalefactor;
	}
	function getGraphRectCenter(layout) {
		var graphRect = layout.getGraphRect();
		return {x : (graphRect.x1 + graphRect.x2) * 0.5, y : (graphRect.y1 + graphRect.y2) * 0.5 }
	}
	function listLimits(graph, graphics){
		var xmax = 0
		var xmin = 0
		var ymax = 0
		var ymin = 0
		graph.forEachNode(function(node) {
			var nodeui = graphics.getNodeUI(node.id)
			xmax = Math.max(xmax, nodeui.position.x)
			xmin = Math.min(xmin, nodeui.position.x)
			ymax = Math.max(ymax, nodeui.position.y)
			ymin = Math.min(ymin, nodeui.position.y)
		});
		return {'xmax': xmax, 'xmin': xmin, 'ymax': ymax, 'ymin': ymin}
    }
		
	//-- the main jHist class
    var jHist = function(){
		this.graph = Viva.Graph.graph()
		this.animation = false
		
		this.VIEW_PARAM = {
			"nodeSize" : 15,
			"springLength" : 10,        // view layout setting
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
			this.graphics = Viva.Graph.View.svgGraphics();
			
			geom = arrowMarker(this.graphics)
			
			this.graphics.node(nodeBehave).placeNode(placeNode).link(showLink).placeLink(placeLink);
			
			var layout_settings = {
				springLength : this.VIEW_PARAM['springLength'],
				springCoeff : this.VIEW_PARAM['springCoeff'],
				dragCoeff : this.VIEW_PARAM['dragCoeff'],
				gravity : this.VIEW_PARAM['gravity'],
				springTransform: (link, spring) => {
					//console.dir(spring)
					//console.dir(link.data)
                    spring.length = this.VIEW_PARAM['springLength'] * link.data.timelength;
					if (link.data.type == "di2di") {
						spring.weight = 0
					}
                }

			}
			this.layout = Viva.Graph.Layout.forceDirected(this.graph, layout_settings);
		
			this.viewObj = window.document.body
			if (gid != undefined) {
				this.viewObj = document.getElementById(gid)
			}
			this.renderer = Viva.Graph.View.renderer(this.graph, {
					layout    : this.layout,
					graphics  : this.graphics,
					container : this.viewObj
			});
		
			this.renderer.run();
			this.animation = true
			//this.renderer.pause()
		},
		addSingleNode : function(node){ this.graph.addNode(node.id, node); this.renderer.rerender() },
		addNodes : function addNodes(nodes) {
				for  (let n=0; n<nodes.length; n++) {
					let node = nodes[n]
					this.graph.addNode(node.id, node)
				}
			},
			
		addSingleLink : function(link, draw){
			if (link.relation != "di2di") {
				if (!link.timelength) {
					link.timelength=10
					if (link.relation == 'wife') {
						link.timelength=4
					}
				}
				if (link.type != 'noshow') {
					this.graph.addLink(link.from, link.to, link)
				}
				this.graph.addLink(link.from, link.to, link);
				if (draw) {
					this.renderer.rerender()
				}
			} else {
				link.timelength=4
				this.graph.addLink(link.from, link.to, link)
			}
		},
		
		addLinks : function (links) {
			for (let n=0; n<links.length; n++) {
				this.addSingleLink(links[n])
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
		listNodes : function (){
			let nodes = []
			this.graph.forEachNode((node) => {
				nodes.push(node.id)
			})
			return nodes
		},
		
		isrunning : function() { return this.animation; },
		pause : function() { this.animation = false; this.renderer.pause(); },
		resume : function() { this.animation = true; this.renderer.resume(); },
		
		getNode : function(nid){ return },
		setCallback : function(callbacktype, f){ callbacks[callbacktype] = f },
		
        listLimits : function (){ return listLimits(this.graph, this.graphics) },
		desiredScale : function () { return desiredScale(this.layout, this.viewObj) },
		getGraphRectCenter : function() { return getGraphRectCenter(this.layout)},
		
		pinNode : function(node_id, pin) { this.layout.pinNode(this.graph.getNode(node_id), pin); return this },
		moveTo : function(node_id, x, y) { var nui = this.graphics.getNodeUI(node_id);
											nui.position.x=x; nui.position.y=y;
											this.renderer.rerender(); }
		
	}
	
    // Create a jMol object and put it i global scope
    return (window.jHist = new jHist());

})(window)

	

