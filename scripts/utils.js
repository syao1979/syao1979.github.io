function fetch_json(url) {
	console.log("fetch_json() :" + url)
	$.ajax({
		dataType: "json",
		async: true,
		url: url,
		success: function(response) {
			return response
		},
		error: function(xhr, ajaxOptions, thrownError){
			return {'errors' : 'failed to fetch file ' + url}
		}
	});
}