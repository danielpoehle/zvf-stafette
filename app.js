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
        zvFList.Groups = [];
        zvFList.DetailGroup = [];
        zvFList.selGroup = '';
        zvFList.TrainDetail = [];
        zvFList.selTrain = '';
        

        zvFList.assignTrains = function(){
            resetGroups();
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
                                                        t.Konflikt.DNumber >= this.startDate.ts && 
                                                        t.Konflikt.DNumber < this.startDate.plus({ days: 7 }).ts).map((t) => {
                                                            const container = {};
                                                            container.Zugnummer = t.Zugnummer;
                                                            container.Verkehrstag = t.Verkehrstag;
                                                            container.Vorgangsnummer = t.Vorgangsnummer;
                                                            container.ZugartFv = t.ZugartFv;
                                                            container.Konflikt = t.Konflikt;
                                                            container.Streckennummer = t.Streckennummer; 
                                                            container.VTSZNR = t.VTSZNR;                                                           
                                                            return container;
                                                        });
                lst = lst.filter((item, index) => { return(lst.findIndex(x => x.VTSZNR === item.VTSZNR)===index);}).sort((a,b) => a.Zugnummer-b.Zugnummer);
                element.trains = lst;
            }
            //console.log(trainsToRG);  
            
            let allTrains = zvFList.BauList.filter((t) => t.Konflikt.DNumber >= this.startDate.ts && 
                                                      t.Konflikt.DNumber < this.startDate.plus({ days: 7 }).ts).map((t) => {
                                                        const container = {};
                                                        container.Zugnummer = t.Zugnummer;
                                                        container.Verkehrstag = t.Verkehrstag;
                                                        container.Vorgangsnummer = t.Vorgangsnummer;
                                                        container.ZugartFv = t.ZugartFv;
                                                        container.Konflikt = t.Konflikt;
                                                        container.Streckennummer = t.Streckennummer; 
                                                        container.VTSZNR = t.VTSZNR;                                                           
                                                        return container;
                                                      });
            allTrains = allTrains.filter((item, index) => {return(allTrains.findIndex(x => x.VTSZNR === item.VTSZNR)===index);}).sort((a,b) => a.Zugnummer-b.Zugnummer);             

            for (let i = 1; i <= trainsToRG.length; i+=1) {
                let trains = trainsToRG.find((t) => t.id === i).trains;
                let other = trainsToRG.filter((t) => t.id !== i).map((t) => t.trains).flat(1);
                let uniTrains = trains.filter((t) => other.findIndex(x => x.VTSZNR === t.VTSZNR)===-1);
                zvFList.Groups.find((t) => t.id === i).trains = uniTrains; 
                allTrains = allTrains.filter((t) => uniTrains.findIndex(x => x.VTSZNR === t.VTSZNR)===-1);
                for (let j = i+1; j <= trainsToRG.length; j+=1) {
                    let secTrains = trainsToRG.find((t) => t.id === j).trains.filter((t) => trains.findIndex(x => x.VTSZNR === t.VTSZNR) !== -1);
                    other = trainsToRG.filter((t) => t.id !== i && t.id !== j).map((t) => t.trains).flat(1);
                    uniTrains = secTrains.filter((t) => other.findIndex(x => x.VTSZNR === t.VTSZNR)===-1);
                    zvFList.Groups.find((t) => t.id === (10*i+j)).trains = uniTrains;
                    allTrains = allTrains.filter((t) => uniTrains.findIndex(x => x.VTSZNR === t.VTSZNR)===-1);
                }
            }
            zvFList.Groups.find((t) => t.id === 1000).trains = allTrains;
            console.log(zvFList.Groups);             
        };

        zvFList.showGroup = function(id){            
            zvFList.DetailGroup = [];
            let grp = zvFList.Groups.find((t) => t.id === id);
            zvFList.selGroup = grp.name;
            let assignedTrains = grp.trains;
            let nrs = assignedTrains.map((x) => x.Zugnummer);
            nrs = nrs.filter((item, index) => {return(nrs.findIndex(x => x === item)===index);});
            for (let i = 0; i < nrs.length; i+=1) {
                const nr = nrs[i];
                let d = assignedTrains.filter(t => t.Zugnummer === nr).map(t => t.Verkehrstag).sort((a,b) => a.DNumber-b.DNumber);
                zvFList.DetailGroup.push({
                    'znr': nr,
                    'type': assignedTrains.find(t => t.Zugnummer === nr).ZugartFv,
                    'days': d.map(t => t.DNumber),
                    'dayList': d.map(t => t.DText).join(', ')
                });
            }
            document.getElementById("nav-profile-tab").click();
        };

        zvFList.showTrain = function(znr, vts){
            zvFList.TrainDetail = [];
            zvFList.selTrain = znr;
            let lst = zvFList.BauList.filter((t) => t.Zugnummer === znr && vts.includes(t.Verkehrstag.DNumber));
            let days = lst.map(t => t.Verkehrstag.DNumber);
            days = days.filter((item, index) => days.indexOf(item)===index).sort();
            for (let i = 0; i < days.length; i+=1) {                
                const tr = lst.filter(t => t.Verkehrstag.DNumber === days[i]);
                zvFList.TrainDetail.push({
                    'day': tr[0].Verkehrstag,
                    'znr': tr[0].Zugnummer,
                    'type': tr[0].ZugartFv,
                    'trains': tr
                });                                
            }
            document.getElementById("nav-mfb-tab").click();
        };

        function getCol(region){
            if(region == "NORD") return('#00BFFF');
            if(region == "OST") return('#C71585');
            if(region == "SÜDOST") return('#FF6347');
            if(region == "MITTE") return('#21618c');
            if(region == "WEST") return('#FFA500');
            if(region == "SÜDWEST") return('#66CDAA');
            if(region == "SÜD") return('#008B8B');
        };

        function resetGroups(){
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
                        result[i].Konflikt = {'Day': dt, 'Time': tm, 'DNumber': luxon.DateTime.fromFormat(dt+'-'+tm, 'dd.MM.yyyy-HH:mm:ss').ts};
                        result[i].VTSZNR = result[i].Verkehrstag.DText + '#' + result[i].Zugnummer;  
                        result[i].Zugnummer = parseInt(result[i].Zugnummer); 
                        result[i].Color = getCol(result[i].Region);                                                                                      
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