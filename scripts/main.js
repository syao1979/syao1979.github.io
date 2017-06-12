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
	function imgurl(type, gender) {
		let imgURL = '/images/man.png'
		if (type == "di-wang") {
			if (gender == 'f') {
				imgURL = '/images/nv-wang.png'
			} else {
				imgURL = '/images/di-wang.png'
			}
		} else {
			if (gender == 'f') {
				imgURL = '/images/woman.png'
			}
		}
		return imgURL
	}
	
	function nodeBehave(node) {
		//console.log(node.id)
		let imgURL = imgurl(node.data.type, node.data.gender)		
		if (node.data.image && node.data.image != "") {
			imgURL = node.data.image
		}
		
		// This time it's a group of elements: http://www.w3.org/TR/SVG/struct.html#Groups
		var ntxt = node.data.id
		if (node.data.name) {
			let nlist = [node.data.id]
			for(let n=0; n<node.data.name.length; n++){
				nlist.push(node.data.name[n]);
			}
			
			ntxt = nlist
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
		if (link.data.hide) {	// do not draw link
			return
		}
		
		// dom element for link label; used in placeLink
//		var label = Viva.Graph.svg('text').attr('id','label_'+link.data.id).text(link.data.id);
//            	        graphics.getSvgRoot().childNodes[0].append(label);
						
		var ui = Viva.Graph.svg('path')
		//console.dir(ui)
		if(link.data.relation == 'wife') {
			ui.attr('stroke', 'pink').attr('stroke-dasharray', '2, 2')
		} else if (link.data.relation == 'son') {
			ui.attr('stroke', 'red').attr('stroke-dasharray', '2, 2').attr('marker-end', 'url(#Triangle)');
		} else if (link.data.type == "di2di") {
			ui.attr('stroke', 'blue')
		} else {
			ui.attr('stroke', 'gray').attr('stroke-dasharray', '5, 5');
		}
		ui.attr('fill', 'none')
		//if (link.data.type == "di2di") {
		//	ui.didi = true	// remember for later use
		//}
		
		//return Viva.Graph.svg('path').attr('stroke', '')
		//						return Viva.Graph.svg('path')
		//                           .attr('stroke', 'red')
		//                           .attr('stroke-dasharray', '5, 5');
		//console.dir(ui)
		return ui
	}
	
	function placeLink(linkUI, fromPos, toPos) {
		var data = 'M' + fromPos.x + ',' + fromPos.y + 'L' + toPos.x + ',' + toPos.y;

		// make start and end points of link at outside center of the node image box
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


		if (linkUI.link.data.type == "di2di") {	//di2di
			data = 'M' + from.x + ',' + from.y + 'L' + to.x + ',' + (to.y + toNodeSize / 4);
		} else if (linkUI.link.data.relation == "son" || linkUI.link.data.relation =="daughter" ){
			data = 'M' + from.x + ',' + from.y + 'L' + to.x + ',' + (to.y - toNodeSize / 4);
		} else {
			data = 'M' + from.x + ',' + from.y + 'L' + to.x + ',' + to.y;
		}
		
		linkUI.attr("d", data);
		
		
		//add link label:
//		 document.getElementById('label_'+linkUI.attr('id'))
//                	.attr("x", (from.x + to.x) / 2)
//                	.attr("y", (from.y + to.y) / 2);
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
			let self = this
			geom = arrowMarker(this.graphics)
			
			this.graphics.node(nodeBehave)
			.placeNode(placeNode)
			.link(showLink)
			.placeLink(placeLink);
			
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
						spring.weight = 0.1
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
			if (link.type != "di2di") {
				if (!link.timelength) {
					link.timelength=10
					if (link.relation == 'wife') {
						link.timelength=4
					}
				}
				this.graph.addLink(link.from, link.to, link)
				
			} else {
				link.timelength = 4
				this.graph.addLink(link.from, link.to, link)
			}
			
			if (draw) {
				this.renderer.rerender()
			}
		},
		
		addLinks : function (links) {
			for (let n=0; n<links.length; n++) {
				this.addSingleLink(links[n])
			}
		},
		
		toJSON : function(){
			return {"nodes" : this.nodeJSON(), "links": this.linkJSON()}
		},
		
		nodeJSON : function(){
			let nodes = []
			this.graph.forEachNode(function(node){
				nodes.push(node.data)
			})
			return nodes
		},
		
		linkJSON : function(){
			let links = []
			this.graph.forEachLink(function(link){
				var ldata = jQuery.extend(true, {}, link.data)
				delete ldata.timelength
				links.push(ldata)
			})
			return links
		},
		
		listNodeIDs : function (){
			let nodes = []
			this.graph.forEachNode((node) => {
				nodes.push(node.id)
			})
			return nodes
		},
		
		isrunning : function() { return this.animation; },
		pause : function() { this.animation = false; this.renderer.pause(); },
		resume : function() { this.animation = true; this.renderer.resume(); },
		rerender : function() { this.renderer.rerender() },
		
		
		getNode : function(nid){ return this.graph.getNode(nid) },
		getNodePosition : function(nid) { return this.graphics.getNodeUI(nid).position; },
		moveNodeTo : function(nid, x, y) { let ui=this.graphics.getNodeUI(nid); ui.position.x = x; ui.position.y = y; this.rerender(); return this; },
		removeNode : function(nid) { let node = this.graph.getNode(nid); this.graph.removeNode(nid); return this;},
		setCallback : function(callbacktype, f){ callbacks[callbacktype] = f; return this },
		
        listLimits : function (){ return listLimits(this.graph, this.graphics) },
		desiredScale : function () { return desiredScale(this.layout, this.viewObj) },
		getGraphRectCenter : function() { return getGraphRectCenter(this.layout)},
		
		pinNode : function(node_id, pin) { let n = this.graph.getNode(node_id); this.layout.pinNode(n, pin); n.pin = pin; },
		
		moveTo : function(node_id, x, y) { var nui = this.graphics.getNodeUI(node_id);
											nui.position.x=x; nui.position.y=y;
											this.renderer.rerender(); return this },
		toggleRunState : function(){ if (this.animation){ this.pause() } else { this.resume() }; return this },
		toggleNodePin : function(node_id) {let n = this.graph.getNode(node_id); this.layout.pinNode(n, !n.pin); n.pin = !n.pin; return this },
		getLinks : function(from_id, to_id){
			let node = this.graph.getNode(from_id)
			let links = []
			for (let n=0; n<node.links.length; n++){
				if (node.links[n].toId == to_id) {
					links.push(node.links[n])
				}
			}
			return links
		},
	}
	 
    // Create a jMol object and put it i global scope
    return (window.jHist = new jHist());

})(window)

	

