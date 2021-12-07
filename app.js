(function () {
    'use strict'; 

    angular.module('ZvF', [])
    .controller('ZvFController', ZvFController)
    .service('ZvFService', ZvFService);
    
    ZvFController.$inject = ['ZvFService'];
    function ZvFController(ZvFService) {
        let zvFList = this;

        zvFList.Filename = 'bla';
        zvFList.loadComplete = false;
        

        $(document).ready(function () {
            $('#list').bind('change', handleDialog);
        });

        function handleDialog(event) {
            const { files } = event.target;
            const file = files[0];
            
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = function (event) {                
                csv({
                    output: "json",
                    delimiter: ";"
                })
                .fromString(event.target.result)
                .then(function(result){
                    
                    //bbpList.CapaList = result;
                    //bbpList.loadComplete = true;
                    //console.log(bbpList.CapaList.length);
                    //console.log(bbpList.CapaList[6]);
                })
            }
        };                
    };

    function ZvFService(){
        let service = this;
    };

})();