angular.module('app', [])
.controller('search', function($scope, movie){
  $scope.display = '';
  $scope.list = [];
  $scope.searchpage = function(){
    //go to full search page?
  }
  $scope.searchLetter = function(){
    //on every letter change after the first letter, do a request to API/server

    if($scope.search.length > 1){
      //need to escape $scope.search because it is user input;
      movie.get($scope.search).then(function(data){
        if(data !== undefined){
          //data is an array with objects that contain a Poster, Title, Type, Year, and imdbID properties
          $scope.list = data;
        }
      });
    } else {
      $scope.list = [];
    }
  }
  $scope.addShow = function(idx){
    //sends ID of clicked show to server/database;
    console.log('clicked');
    console.log(idx);
    console.log($scope.list[idx].imdbID);
  }
  
})


.factory('movie', function($http){
  
  var get = function(show){
    var query = show.split(' ').join('+');

    return $http({
      method:"GET",
      url: "http://www.omdbapi.com/?s=" + query + "&limit=5"
    }).then(function(response){
      return response.data.Search;
    })
  }
  return {
    get: get
  };
})