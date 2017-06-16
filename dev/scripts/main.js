var app = {};
app.moviesArray = [];
app.albumPromises = [];
app.trackPromises = [];
const movieApiKey = 'f012df5d63927931e82fe659a8aaa3ac';
const movieBaseApiUrl = 'https://api.themoviedb.org/3';
const movieImageBaseUrl = 'https://image.tmdb.org/t/p/w500';
const albumBaseUrl = 'https://api.spotify.com/v1/';

// document ready function
$(function(){
	app.auth().then(app.init);
});
// ""
app.auth = () => {
	return $.ajax({
		url: 'https://proxy.hackeryou.com',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		data: JSON.stringify({
			reqUrl: 'https://accounts.spotify.com/api/token',
			params: {
				grant_type: 'client_credentials'
			},
			proxyHeaders: {
				'Authorization': `Basic OTRjY2MxOTlkYzAwNDE5OTg0ZTU5NDgyM2JkYWYwMTQ6ZmMxZWM4NWU5MmFiNDY3MWJhM2M5NjViZjI3Y2E5Mzc=`
			}
		})
	})
}


app.authHeaders = {};

// functions fired on page load
app.init = function(authData){

	app.authHeaders = {
		'Authorization': `${authData.token_type} ${authData.access_token}`
	}
	app.getMoviesData();
	app.form();

	$('.navbar-wrapper').stickUp();

	$('.anchor-scroll').anchorScroll({
	   scrollSpeed: 900, // scroll speed
	   offsetTop: 0, // offset for fixed top bars (defaults to 0)
	   onScroll: function () { 
	     // callback on scroll start
	   },
	   scrollEnd: function () { 
	     // callback on scroll end
	   }
	});
}

// getting data from moviebd api
app.getMoviesData = function(){
	$.ajax({
		url: movieBaseApiUrl + '/movie/popular',
		method: 'GET',
		dataType: 'JSON',
		data: {
			api_key: movieApiKey,
			language: 'en-US'
		}
	})
	.then(function(res){
		app.getPopularMovies(res.results);
	});
}

// data from the moviedb api is stored in an object and sent to displayContent method 
app.getPopularMovies = function(movies){
	for(var i = 0; i < 5; i++){
		var movie = {};
		movie.id = i;
		movie.title = movies[i].title;
		movie.image = movieImageBaseUrl + movies[i].poster_path;
		movie.overview = movies[i].overview;
		movie.releaseDate = movies[i].release_date;

		app.albumPromises.push(app.getAlbumData(movie.title));
		app.moviesArray.push(movie);
	}
	
	$.when(...app.albumPromises)
		.done(function(...results) {
			results.forEach(function(result) {
				const albumId = result[0].albums.items[0].id;
				app.trackPromises.push(app.getTracksByAlbumId(albumId));
			});
			app.getTracks(app.trackPromises);
		});
}

// at this point we have made a request for all of the tracks associated with each album and we are waiting for them to come back
app.getTracks = function(promises) {
	$.when(...promises)
	// when the .done fires, we now have all of our tracks associated with each one of our albums
		.done(function(...tracklists) {
			// we loop over each one of our track lists that correspond to each one of our movies
			tracklists.forEach(function(albumTracks, index) {
				// because the number of albums and the number of movies are identical in length and in the same order we can use their indexes to match them up to each other
				app.moviesArray[index].uris = [];
				// here we ^^ create an empty array to store the uris in once we grab them from each tracklist
				// we loop over each track individually to grab its uri
				albumTracks[0].items.forEach(function(item) {
					// we push each individual track's uri into the uri list that corresponds with each individual movie, using the index in order to match up the uri to its corresponding uri array in its corresponding movie
					app.moviesArray[index].uris.push(item.uri);
				});
				app.pushToHandleBars(app.moviesArray[index]);
			});
			app.tilt();
			// finally what we end up with is an array that contains five objects. each object represents one movie. each movie has a uris property which is an array, and this array contains three spotify ids that correspond to the three tracks that are most popular for that particular movie
		});	
}

// gets album if from the spotify
app.getAlbumData = function(movieName){

	return $.ajax({
		url: albumBaseUrl + 'search/',
		method: 'GET',
		headers: app.authHeaders,
		data: {
			q: movieName + ' soundtrack',
			type: 'album',
			limit: 1
		}
	});
}

app.getTracksByAlbumId = function(id) {
	return $.ajax({
		url: albumBaseUrl + `albums/${id}/tracks`,
		method: 'GET',
		headers: app.authHeaders,
		data: {
			limit: 3
		}
	});
}

// connects to handlebars and display movie info on the html
app.pushToHandleBars = function(data){
	var dataTemplate = $('#data').html();
	var compileDataTemplate = Handlebars.compile(dataTemplate);
	var finalDataTemplate = compileDataTemplate(data);
	$('ul').append(finalDataTemplate);
}

app.form = function(){
	$('form').on('submit', function(e){
		e.preventDefault();
		var movieName = $('#movie-name').val();
		var movie = {};
		var getMoviesDataPromise = app.getMovieFromForm(movieName);
		var albumIdPromise = app.getAlbumData(movieName);

		$.when(getMoviesDataPromise)
			.then(function(data){
				if(data.total_results === 0){
					alert('Please enter another movie name... ');
				}
				else{
					var movies = data.results[0];
					movie.id = 0;
					movie.title = movies.title;
					movie.image = movieImageBaseUrl + movies.poster_path;
					movie.overview = movies.overview;
					movie.releaseDate = movies.release_date;

					$.when(albumIdPromise)
						.then(function(album){
							if(album.albums.total === 0){
								alert('Please enter another movie name... ');
							}
							else{
								var albumId = album.albums.items[0].id;
								var getSingleAlbum = app.getTracksByAlbumId(albumId);
								$.when(getSingleAlbum)
									.then(function(albumObject){
										var trackIdsArray = [];
										albumObject.items.forEach(function(track){
											trackIdsArray.push(track.uri);
										});
										movie.uris = trackIdsArray;
										app.displayContentForm(movie);
										app.tilt();
								});
							}
						});
				}
			});
		$('#movie-name').val('');
	});
}

app.getMovieFromForm = function(movieName){
 	return $.ajax({
 		url: movieBaseApiUrl + '/search/movie',
 		method: 'GET',
 		dataType: 'JSON',
 		data: {
 			api_key: movieApiKey,
 			language: 'en-US',
 			query: movieName
 		}
 	});
 }

app.displayContentForm = function(movie){
	var dataTemplate = $('#data').html();
	var compileDataTemplate = Handlebars.compile(dataTemplate);
	var finalDataTemplate = compileDataTemplate(movie);

	$('ul').html(finalDataTemplate);
}

app.tilt = function() {

	if ($(window).width() > 760){
		$("ul").tiltedpage_scroll({
		  sectionContainer: "> .container",     // In case you don't want to use <section> tag, you can define your won CSS selector here
		  angle: 20,                         // You can define the angle of the tilted section here. Change this to false if you want to disable the tilted effect. The default value is 50 degrees.
		  opacity: true,                     // You can toggle the opacity effect with this option. The default value is true
		  scale: false,                       // You can toggle the scaling effect here as well. The default value is true.
		  outAnimation: true                 // In case you do not want the out animation, you can toggle this to false. The defaul value is true.
		});
	}
}