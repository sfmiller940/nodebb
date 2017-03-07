(function () {
'use strict';

  var nodeBB = angular.module('nodeBB', ['ui.router']);

  nodeBB

    .config(function($stateProvider, $urlRouterProvider) {
      
      $stateProvider
        .state('threads',{
          url: '/',
          templateUrl: '/templates/threads.html',
          controller: 'threadsCtrl' 
        })
        .state('posts',{
          url: '/:tid',
          templateUrl: 'templates/posts.html',
          controller: 'postsCtrl'
        }
      );

      $urlRouterProvider.otherwise('/');
    })
    
    .controller("threadsCtrl", function($scope, $http) {
      $http.get("/threads").then(function(response) {
        $scope.threads = response.data['threads'];
      });

      $scope.sendThread = function(){
        $http.post(
          '/threads',
          JSON.stringify({
            username : $scope.newthread.username,
            title : $scope.newthread.title,
            body : $scope.newthread.body
          }),
          {"content-type": "application/json",}
        ).then(function(response){
          $scope.threads = response.data['threads'];
          $scope.newthread = {};
        });
      };
    })

    .controller('postsCtrl',function($scope, $http, $stateParams){
      $http.get('/threads/' + $stateParams.tid).then(function(response){
        $scope.posts = response.data['posts'];
        $scope.thread = response.data['thread'];
      });

      $scope.sendPost = function(){
        console.log($scope.newpost.username + ' ' + $scope.newpost.body);
        $http.post(
          '/threads/' + $scope.thread.id,
          JSON.stringify({
            username : $scope.newpost.username,
            body : $scope.newpost.body,
          }),
          {"content-type": "application/json",}
        ).then(function(response){
          $scope.posts = response.data['posts'];
          $scope.newpost={};
        });
      };
    });
})();