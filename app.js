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
        zvFList.startDate = luxon.DateTime.fromFormat('01.12.2021', 'dd.MM.yyyy');
        zvFList.BauList = [];
        zvFList.Groups = [
            {'name': 'OST', 'id': 1, 'trains': []},
            {'name': 'NORD', 'id': 2, 'trains': []},
            {'name': 'WEST', 'id': 3, 'trains': []},
            {'name': 'SÜDOST', 'id': 4, 'trains': []},
            {'name': 'MITTE', 'id': 5, 'trains': []},
            {'name': 'SÜDWEST', 'id': 6, 'trains': []},
            {'name': 'SÜD', 'id': 7, 'trains': []},
            {'name': 'OST-NORD', 'id': 12, 'trains': []},
            {'name': 'OST-WEST', 'id': 13, 'trains': []},
            {'name': 'OST-SÜDOST', 'id': 14, 'trains': []},
            {'name': 'OST-MITTE', 'id': 15, 'trains': []},
            {'name': 'OST-SÜDWEST', 'id': 16, 'trains': []},
            {'name': 'OST-SÜD', 'id': 17, 'trains': []},
            {'name': 'NORD-WEST', 'id': 23, 'trains': []},
            {'name': 'NORD-SÜDOST', 'id': 24, 'trains': []},
            {'name': 'NORD-MITTE', 'id': 25, 'trains': []},
            {'name': 'NORD-SÜDWEST', 'id': 26, 'trains': []},
            {'name': 'NORD-SÜD', 'id': 27, 'trains': []},
            {'name': 'WEST-SÜDOST', 'id': 34, 'trains': []},
            {'name': 'WEST-MITTE', 'id': 35, 'trains': []},
            {'name': 'WEST-SÜDWEST', 'id': 36, 'trains': []},
            {'name': 'WEST-SÜD', 'id': 37, 'trains': []},
            {'name': 'SÜDOST-MITTE', 'id': 45, 'trains': []},
            {'name': 'SÜDOST-SÜDWEST', 'id': 46, 'trains': []},
            {'name': 'SÜDOST-SÜD', 'id': 47, 'trains': []},
            {'name': 'MITTE-SÜDWEST', 'id': 56, 'trains': []},
            {'name': 'MITTE-SÜD', 'id': 57, 'trains': []},
            {'name': 'SÜDWEST-SÜD', 'id': 67, 'trains': []},
            {'name': 'Betroffenheit 3+ Regionen', 'id': 1000, 'trains': []}
        ];

        zvFList.assignTrains = function(){
            let trainsToRG = [
                {'name': 'OST', 'id': 1, 'trains': []},
                {'name': 'NORD', 'id': 2, 'trains': []},
                {'name': 'WEST', 'id': 3, 'trains': []},
                {'name': 'SÜDOST', 'id': 4, 'trains': []},
                {'name': 'MITTE', 'id': 5, 'trains': []},
                {'name': 'SÜDWEST', 'id': 6, 'trains': []},
                {'name': 'SÜD', 'id': 7, 'trains': []}
            ];

            for (let i = 1; i <= trainsToRG.length; i+=1) {
                const element = trainsToRG.find((t) => t.id === i);
                let lst = zvFList.BauList.filter((t) => t.Region === element.name && 
                                                        t.Verkehrstag.DNumber >= this.startDate.ts && 
                                                        t.Verkehrstag.DNumber < this.startDate.plus({ days: 7 }).ts).map((t) => t.Zugnummer);
                lst = lst.filter((item, index) => lst.indexOf(item)===index).sort((a,b) => a-b);
                element.trains = lst;
            }
            console.log(trainsToRG);  
            
            let allTrains = zvFList.BauList.filter((t) => t.Verkehrstag.DNumber >= this.startDate.ts && 
                                                      t.Verkehrstag.DNumber < this.startDate.plus({ days: 7 }).ts).map((t) => t.Zugnummer);
            allTrains = allTrains.filter((item, index) => allTrains.indexOf(item)===index).sort((a,b) => a-b);             

            for (let i = 1; i <= trainsToRG.length; i+=1) {
                let trains = trainsToRG.find((t) => t.id === i).trains;
                let other = trainsToRG.filter((t) => t.id !== i).map((t) => t.trains).flat(1);
                let uniTrains = trains.filter((t) => !other.includes(t));
                zvFList.Groups.find((t) => t.id === i).trains = uniTrains; 
                allTrains = _.difference(allTrains, uniTrains);
                for (let j = i+1; j <= trainsToRG.length; j+=1) {
                    let secTrains = trainsToRG.find((t) => t.id === j).trains.filter((t) => trains.includes(t));
                    other = trainsToRG.filter((t) => t.id !== i && t.id !== j).map((t) => t.trains).flat(1);
                    uniTrains = secTrains.filter((t) => !other.includes(t));
                    zvFList.Groups.find((t) => t.id === (10*i+j)).trains = uniTrains;
                    allTrains = _.difference(allTrains, uniTrains);
                }
            }
            zvFList.Groups.find((t) => t.id === 1000).trains = allTrains;
            console.log(zvFList.Groups); 
            console.log(allTrains);
        };
        

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
                    for (let i = 0; i < result.length; i+= 1) {
                        const vt = result[i].Verkehrstag; 
                        result[i].Verkehrstag = {'DText': vt, 'DNumber': luxon.DateTime.fromFormat(vt, 'dd.MM.yyyy').ts};
                        const dt = result[i].Konflikttag;
                        const tm = result[i]['Startzeit Verletzung'];
                        result[i].Konflikt = {'Day': dt, 'Time': tm, 'DNumber': luxon.DateTime.fromFormat(dt+'-'+tm, 'dd.MM.yyyy-HH:mm:ss').ts}                                                                                         
                    }
                    
                    zvFList.BauList = result;
                    zvFList.loadComplete = true;
                    console.log(zvFList.BauList.length);
                    console.log(zvFList.BauList[5]);
                })
            }
        };                
    };

    function ZvFService(){
        let service = this;
        let x = [
            {'name': 'OST-NORD-WEST', 'id': 123, 'trains': []},
            {'name': 'OST-NORD-SÜDOST', 'id': 124, 'trains': []},
            {'name': 'OST-NORD-MITTE', 'id': 125, 'trains': []},
            {'name': 'OST-NORD-SÜDWEST', 'id': 126, 'trains': []},
            {'name': 'OST-NORD-SÜD', 'id': 127, 'trains': []},
            {'name': 'OST-WEST-SÜDOST', 'id': 134, 'trains': []},
            {'name': 'OST-WEST-MITTE', 'id': 135, 'trains': []},
            {'name': 'OST-WEST-SÜDWEST', 'id': 136, 'trains': []},
            {'name': 'OST-WEST-SÜD', 'id': 137, 'trains': []},
            {'name': 'OST-SÜDOST-MITTE', 'id': 145, 'trains': []},
            {'name': 'OST-SÜDOST-SÜDWEST', 'id': 146, 'trains': []},
            {'name': 'OST-SÜDOST-SÜD', 'id': 147, 'trains': []},
            {'name': 'OST-MITTE-SÜDWEST', 'id': 156, 'trains': []},
            {'name': 'OST-MITTE-SÜD', 'id': 157, 'trains': []},
            {'name': 'OST-SÜDWEST-SÜD', 'id': 167, 'trains': []},
            {'name': 'NORD-WEST-SÜDOST', 'id': 234, 'trains': []},
            {'name': 'NORD-WEST-MITTE', 'id': 235, 'trains': []},
            {'name': 'NORD-WEST-SÜDWEST', 'id': 236, 'trains': []},
            {'name': 'NORD-WEST-SÜD', 'id': 237, 'trains': []},
            {'name': 'NORD-SÜDOST-MITTE', 'id': 245, 'trains': []},
            {'name': 'NORD-SÜDOST-SÜDWEST', 'id': 246, 'trains': []},
            {'name': 'NORD-SÜDOST-SÜD', 'id': 247, 'trains': []},
            {'name': 'NORD-MITTE-SÜDWEST', 'id': 256, 'trains': []},
            {'name': 'NORD-MITTE-SÜD', 'id': 257, 'trains': []},
            {'name': 'NORD-SÜDWEST-SÜD', 'id': 267, 'trains': []},
            {'name': 'WEST-SÜDOST-MITTE', 'id': 345, 'trains': []},
            {'name': 'WEST-SÜDOST-SÜDWEST', 'id': 346, 'trains': []},
            {'name': 'WEST-SÜDOST-SÜD', 'id': 347, 'trains': []},
            {'name': 'WEST-MITTE-SÜDWEST', 'id': 356, 'trains': []},
            {'name': 'WEST-MITTE-SÜD', 'id': 357, 'trains': []},
            {'name': 'WEST-SÜDWEST-SÜD', 'id': 367, 'trains': []},
            {'name': 'SÜDOST-MITTE-SÜDWEST', 'id': 456, 'trains': []},
            {'name': 'SÜDOST-MITTE-SÜD', 'id': 457, 'trains': []},
            {'name': 'SÜDOST-SÜDWEST-SÜD', 'id': 467, 'trains': []},
            {'name': 'MITTE-SÜDWEST-SÜD', 'id': 567, 'trains': []}
        ];
    };

})();