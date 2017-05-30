app = {};

const movieApiKey = 'f012df5d63927931e82fe659a8aaa3ac';
const movieBaseApiUrl = 'https://api.themoviedb.org/3';
const movieImageBaseUrl = 'https://image.tmdb.org/t/p/w500'

// Client ID
// 94ccc199dc00419984e594823bdaf014
// Client Secret
// fc1ec85e92ab4671ba3c965bf27ca937

// document ready function
$(function(){
	app.init();
});

// functions fired on page load
app.init = function(){
	app.getMoviesData();
	app.form();
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
		movie.title = movies[i].title;
		movie.image = movieImageBaseUrl + movies[i].poster_path;
		movie.overview = movies[i].overview;
		movie.releaseDate = movies[i].release_date;
		
		app.displayContent(movie);
	}
}

// connects to handlebars and display movie info on the html
app.displayContent = function(movie){
	var dataTemplate = $('#data').html();
	var compileDataTemplate = Handlebars.compile(dataTemplate);
	var finalDataTemplate = compileDataTemplate(movie);

	$('ul').append(finalDataTemplate);
}

app.form = function(){
	$('form').on('submit', function(e){
		e.preventDefault();
		var movieName = $('#movie-name').val();
		$('#movie-name').val('');

		console.log(movieName);
		app.getMovieFromForm(movieName);
	});
}

app.getMovieFromForm = function(movieName){
	$.ajax({
		url: movieBaseApiUrl + '/search/movie',
		method: 'GET',
		dataType: 'JSON',
		data: {
			api_key: movieApiKey,
			language: 'en-US',
			query: movieName
		}
	})
	.then(function(res){
		var movie = {}
		movie.title = res.results[0].title;
		movie.image = movieImageBaseUrl + res.results[0].poster_path
		console.log(movie);
		app.displayContentForm(movie);
	});
}
app.displayContentForm = function(movie){
	var dataTemplate = $('#data').html();
	var compileDataTemplate = Handlebars.compile(dataTemplate);
	var finalDataTemplate = compileDataTemplate(movie);

	$('ul').html(finalDataTemplate);
}