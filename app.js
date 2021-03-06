(function () {
    'use strict'; 

    angular.module('ZvF', [])
    .controller('ZvFController', ZvFController)
    .service('ZvFService', ZvFService);
    
    ZvFController.$inject = ['ZvFService'];
    function ZvFController(ZvFService) {
        let zvFList = this;

        zvFList.Filename = 'bla';
        zvFList.selRegion = '';
        zvFList.loadComplete = false;
        zvFList.startDate = luxon.DateTime.fromFormat('16.11.2022', 'dd.MM.yyyy');
        zvFList.BauList = [];
        zvFList.FilteredBauList = [];
        zvFList.Groups = [];
        zvFList.DetailGroup = [];
        zvFList.selGroup = '';
        zvFList.TrainDetail = [];
        zvFList.selTrain = '';
        zvFList.BTKlist = [];
        zvFList.regBTK = [];
        zvFList.selBTK = [];
        zvFList.delay = 0;
        zvFList.comment = '';
        zvFList.StafetteStatus = [];
        zvFList.RedList = [];
        zvFList.TrainRed = [];
        

        zvFList.assignTrains = function(){
            resetGroups();

            zvFList.FilteredBauList = zvFList.BauList.filter((t) => t.Konflikt.DNumber >= this.startDate.ts && 
                                                        t.Konflikt.DNumber < this.startDate.plus({ days: 7 }).ts);

            let znr = zvFList.FilteredBauList.map((t) => t.Zugnummer);
            znr = znr.filter((item, index) => znr.indexOf(item)===index);

            for (let i = 0; i < znr.length; i+=1) {                
                let affections = zvFList.FilteredBauList.filter((t) => t.Zugnummer === znr[i]);
                let region = affections.map((t) => t.Region);
                region = region.filter((item, index) => region.indexOf(item)===index);
                if(region.length > 2){
                    zvFList.Groups.find((t) => t.id === 1000).trains.push(affections);
                }else if(region.length === 1){
                    zvFList.Groups.find((t) => region[0] === t.rgIds[0] && t.rgIds.length === 1).trains.push(affections);
                }else{
                    //region has two different elements
                    zvFList.Groups.find((t) => t.rgIds.includes(region[0]) && t.rgIds.includes(region[1]) && t.rgIds.length === 2).trains.push(affections);
                }
            }
            console.log(zvFList.Groups);             
        };

        zvFList.showGroup = function(id){            
            zvFList.DetailGroup = [];
            let grp = zvFList.Groups.find((t) => t.id === id);
            console.log(grp);
            zvFList.selGroup = grp.name;
            for (let i = 0; i < grp.trains.length; i+=1) {
                let days = grp.trains[i].map((t) => t.Verkehrstag.DText).sort();                
                days = days.filter((item, index) => days.indexOf(item)===index); 
                let rg = grp.trains[i].map((t) => t.Region).sort();  
                rg = rg.filter((item, index) => rg.indexOf(item)===index);             
                zvFList.DetailGroup.push({
                    'znr': grp.trains[i][0].Zugnummer,
                    'type': grp.trains[i][0].ZugartFv,
                    'reg': rg.join(', '),
                    'VdayList': days.join(', ')
                });
            }
            document.getElementById("nav-profile-tab").click();
        };

        zvFList.showTrain = function(znr){
            zvFList.TrainDetail = [];
            zvFList.selTrain = znr;
            let lst = zvFList.FilteredBauList.filter((t) => t.Zugnummer === znr);
            let days = lst.map(t => t.Verkehrstag.DNumber);
            days = days.filter((item, index) => days.indexOf(item)===index).sort();
            for (let i = 0; i < days.length; i+=1) {                
                const tr = lst.filter(t => t.Verkehrstag.DNumber === days[i]);
                let dir = zvFList.BTKlist.findIndex((t) => t.VTSZNR === tr[0].VTSZNR);
                dir = dir === -1? '' : zvFList.BTKlist[dir].DIR;
                zvFList.TrainDetail.push({
                    'day': tr[0].Verkehrstag,
                    'znr': tr[0].Zugnummer,
                    'type': tr[0].ZugartFv,
                    'trains': tr,
                    'dir': dir
                });                                
            }
            document.getElementById("nav-mfb-tab").click();
        };

        zvFList.setOrder = function(d, ascending){            
            zvFList.BTKlist = zvFList.BTKlist.filter((t) => t.VTSZNR !== d.trains[0].VTSZNR);
            d.dir = ascending? 'Vorw??rts' : 'R??ckw??rts';
            createOrder(d, ascending);
            console.log(zvFList.BTKlist);
        };

        zvFList.setSplit = function(d, index){            
            zvFList.BTKlist = zvFList.BTKlist.filter((t) => t.VTSZNR !== d.trains[0].VTSZNR);
            d.dir = 'Split';
            let ordered = d.trains.sort((a,b) => a.Konflikt.DNumber-b.Konflikt.DNumber);
            let asc = {...d};
            asc.trains = ordered.slice(0,index+1);
            createOrder(asc, false);
            let desc = {...d};
            desc.trains = ordered.slice(index);
            createOrder(desc, true);
            console.log(zvFList.BTKlist);
        };

        function createOrder(d, ascending){
            let orderedTrains = ascending? d.trains.sort((a,b) => a.Konflikt.DNumber-b.Konflikt.DNumber): d.trains.sort((a,b) => b.Konflikt.DNumber-a.Konflikt.DNumber);
            let indArray = zvFList.BTKlist.map((t) => t.ID);
            let maxInd = Math.max(0, ...indArray);
            for (let i = 0; i < orderedTrains.length; i+=1) {
                zvFList.BTKlist.push({
                    'ID': maxInd + i + 1,
                    'BTK': orderedTrains[i]['Korridor Name'],
                    'VTSZNR': orderedTrains[i].VTSZNR,
                    'ZNR': orderedTrains[i].Zugnummer,
                    'TYPE': orderedTrains[i].ZugartFv,
                    'V_DAY': orderedTrains[i].Verkehrstag,
                    'K_DAY': orderedTrains[i].Konflikt,
                    'DIR': ascending? 'Vorw??rts' : 'R??ckw??rts',
                    'ORD': i,
                    'FINISH': false,
                    'CUR_WORK': i===0? true : false,
                    'WEIGHT': orderedTrains.length-i,
                    'PRE_ID': i===0? -1 : maxInd + i,
                    'POST_ID': i===orderedTrains.length-1? -1 : maxInd + i + 2,
                    'DELAY_HERE': '',
                    'COMMENT_HERE': '',
                    'DELAY_INC': '',
                    'COMMENT_INC': '',
                    'REGION': orderedTrains[i].Region,
                    'BTS': orderedTrains[i].Betriebsstelle,
                    'MAX_DELAY': orderedTrains[i]['N??chste TSP Abstand'] === ''? 100000 : Math.ceil(orderedTrains[i]['N??chste TSP Abstand']/60.0),
                    'NEXT_TSP': orderedTrains[i]['N??chste TSP Btst']
                });                
            }
        };

        zvFList.setRegion = function(rg){
            zvFList.StafetteStatus = [];
            zvFList.regBTK = [];
            zvFList.selRegion = rg;
            let filtered = zvFList.BTKlist.filter((t) => t.REGION === rg);
            let btk = filtered.map((t) => t.BTK);
            btk = btk.filter((item, index) => btk.indexOf(item)===index).sort();
            for (let ind = 0; ind < btk.length; ind+=1) {
                let d = filtered.filter((t) => t.BTK === btk[ind]);
                let prio = d.map((t) => {if(t.WEIGHT>1 && t.CUR_WORK) {return 1;} else{return 0;}}).reduce((pv, cv) => {return pv+cv}, 0);
                let active = d.map((t) => {if(t.CUR_WORK) {return 1;} else{return 0;}}).reduce((pv, cv) => {return pv+cv}, 0);
                let finish = d.map((t) => {if(t.FINISH) {return 1;} else{return 0;}}).reduce((pv, cv) => {return pv+cv}, 0);
                let znr = d.map((t) => t.VTSZNR);
                znr = znr.filter((item, index) => znr.indexOf(item)===index);
                zvFList.regBTK.push({
                    'id': ind,
                    'BTK': btk[ind],
                    'PRIO': prio,
                    'ANZ': znr.length,
                    'ACTIVE': active,
                    'FINISH': finish,
                    'trains': d
                });
                
            }
        };

        zvFList.addToRedList = function(vtsznr){
            let trains = zvFList.BTKlist.filter((t) => t.VTSZNR === vtsznr);
            let reg = trains.map((t) => t.REGION);
            reg = reg.filter((item, index) => reg.indexOf(item)===index).sort().join(', ');
            zvFList.RedList = zvFList.RedList.filter((t) => t.VTSZNR !== vtsznr);
            zvFList.RedList.push({
                'VTSZNR': trains[0].VTSZNR,
                'ZNR': trains[0].ZNR,
                'V_DAY': trains[0].V_DAY,
                'ANZ_BTK': trains.length,
                'REGIONEN': reg,
                'trains': trains
            });
        };

        zvFList.getRedTrain = function(vtsznr){
            zvFList.TrainRed = zvFList.BTKlist.filter((t) => t.VTSZNR === vtsznr);
            document.getElementById("nav-edit-tab").click();
        };

        zvFList.getStafetteStatus = function(vtsznr){
            zvFList.StafetteStatus = zvFList.BTKlist.filter((t) => t.VTSZNR === vtsznr);
        };

        zvFList.showCorridor = function(id){
            zvFList.selBTK = zvFList.regBTK.find((t) => t.id === id).trains;
            document.getElementById("nav-saved-tab").click();
        };

        zvFList.getBM = function(id){
            if(id === -1){return "";}
            let btk = zvFList.BTKlist.find((t) => t.ID === id);
            return (btk.BTS + " (" + btk.REGION + ")");
        };

        zvFList.changeDelay = function(time, absolute = false){
            if(absolute){zvFList.delay = time;}
            else{zvFList.delay += time;}            
        };

        zvFList.setDelay = function(id){
            zvFList.BTKlist.find((t) => t.ID === id).DELAY_HERE = zvFList.delay;
        };

        zvFList.setComment = function(id){
            zvFList.BTKlist.find((t) => t.ID === id).COMMENT_HERE = zvFList.comment;
        };

        zvFList.transferDelay = function(id){
            let currentCorridor = zvFList.BTKlist.find((t) => t.ID === id);
            currentCorridor.CUR_WORK = false;
            currentCorridor.FINISH = true;
            zvFList.comment = '';
            zvFList.delay = 0;

            if(currentCorridor.POST_ID > 0){
                let nextCorridor = zvFList.BTKlist.find((t) => t.ID === currentCorridor.POST_ID); 
                nextCorridor.CUR_WORK = true;
                nextCorridor.DELAY_INC = currentCorridor.DELAY_HERE;
                nextCorridor.COMMENT_INC = currentCorridor.COMMENT_HERE;
            }            
        };

        function getCol(region){
            if(region == "NORD") return('#00BFFF');
            if(region == "OST") return('#C71585');
            if(region == "S??DOST") return('#FF6347');
            if(region == "MITTE") return('#21618c');
            if(region == "WEST") return('#FFA500');
            if(region == "S??DWEST") return('#66CDAA');
            if(region == "S??D") return('#008B8B');
        };

        function resetGroups(){
            zvFList.Groups = [
                {'name': 'OST', 'id': 1, 'trains': [], 'rgIds': ['OST']},
                {'name': 'NORD', 'id': 2, 'trains': [], 'rgIds': ['NORD']},
                {'name': 'WEST', 'id': 3, 'trains': [], 'rgIds': ['WEST']},
                {'name': 'S??DOST', 'id': 4, 'trains': [], 'rgIds': ['S??DOST']},
                {'name': 'MITTE', 'id': 5, 'trains': [], 'rgIds': ['MITTE']},
                {'name': 'S??DWEST', 'id': 6, 'trains': [], 'rgIds': ['S??DWEST']},
                {'name': 'S??D', 'id': 7, 'trains': [], 'rgIds': ['S??D']},
                {'name': 'OST-NORD', 'id': 12, 'trains': [], 'rgIds': ['OST','NORD']},
                {'name': 'OST-WEST', 'id': 13, 'trains': [], 'rgIds': ['OST','WEST']},
                {'name': 'OST-S??DOST', 'id': 14, 'trains': [], 'rgIds': ['OST','S??DOST']},
                {'name': 'OST-MITTE', 'id': 15, 'trains': [], 'rgIds': ['OST','MITTE']},
                {'name': 'OST-S??DWEST', 'id': 16, 'trains': [], 'rgIds': ['OST','S??DWEST']},
                {'name': 'OST-S??D', 'id': 17, 'trains': [], 'rgIds': ['OST','S??D']},
                {'name': 'NORD-WEST', 'id': 23, 'trains': [], 'rgIds': ['NORD','WEST']},
                {'name': 'NORD-S??DOST', 'id': 24, 'trains': [], 'rgIds': ['NORD','S??DOST']},
                {'name': 'NORD-MITTE', 'id': 25, 'trains': [], 'rgIds': ['NORD','MITTE']},
                {'name': 'NORD-S??DWEST', 'id': 26, 'trains': [], 'rgIds': ['NORD','S??DWEST']},
                {'name': 'NORD-S??D', 'id': 27, 'trains': [], 'rgIds': ['NORD','S??D']},
                {'name': 'WEST-S??DOST', 'id': 34, 'trains': [], 'rgIds': ['WEST','S??DOST']},
                {'name': 'WEST-MITTE', 'id': 35, 'trains': [], 'rgIds': ['WEST','MITTE']},
                {'name': 'WEST-S??DWEST', 'id': 36, 'trains': [], 'rgIds': ['WEST','S??DWEST']},
                {'name': 'WEST-S??D', 'id': 37, 'trains': [], 'rgIds': ['WEST','S??D']},
                {'name': 'S??DOST-MITTE', 'id': 45, 'trains': [], 'rgIds': ['S??DOST','MITTE']},
                {'name': 'S??DOST-S??DWEST', 'id': 46, 'trains': [], 'rgIds': ['S??DOST','S??DWEST']},
                {'name': 'S??DOST-S??D', 'id': 47, 'trains': [], 'rgIds': ['S??DOST','S??D']},
                {'name': 'MITTE-S??DWEST', 'id': 56, 'trains': [], 'rgIds': ['MITTE','S??DWEST']},
                {'name': 'MITTE-S??D', 'id': 57, 'trains': [], 'rgIds': ['MITTE','S??D']},
                {'name': 'S??DWEST-S??D', 'id': 67, 'trains': [], 'rgIds': ['S??DWEST','S??D']},
                {'name': 'Betroffenheit 3+ Regionen', 'id': 1000, 'trains': [], 'rgIds': ['alle']}
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
            {'name': 'OST-NORD-S??DOST', 'id': 124, 'trains': []},
            {'name': 'OST-NORD-MITTE', 'id': 125, 'trains': []},
            {'name': 'OST-NORD-S??DWEST', 'id': 126, 'trains': []},
            {'name': 'OST-NORD-S??D', 'id': 127, 'trains': []},
            {'name': 'OST-WEST-S??DOST', 'id': 134, 'trains': []},
            {'name': 'OST-WEST-MITTE', 'id': 135, 'trains': []},
            {'name': 'OST-WEST-S??DWEST', 'id': 136, 'trains': []},
            {'name': 'OST-WEST-S??D', 'id': 137, 'trains': []},
            {'name': 'OST-S??DOST-MITTE', 'id': 145, 'trains': []},
            {'name': 'OST-S??DOST-S??DWEST', 'id': 146, 'trains': []},
            {'name': 'OST-S??DOST-S??D', 'id': 147, 'trains': []},
            {'name': 'OST-MITTE-S??DWEST', 'id': 156, 'trains': []},
            {'name': 'OST-MITTE-S??D', 'id': 157, 'trains': []},
            {'name': 'OST-S??DWEST-S??D', 'id': 167, 'trains': []},
            {'name': 'NORD-WEST-S??DOST', 'id': 234, 'trains': []},
            {'name': 'NORD-WEST-MITTE', 'id': 235, 'trains': []},
            {'name': 'NORD-WEST-S??DWEST', 'id': 236, 'trains': []},
            {'name': 'NORD-WEST-S??D', 'id': 237, 'trains': []},
            {'name': 'NORD-S??DOST-MITTE', 'id': 245, 'trains': []},
            {'name': 'NORD-S??DOST-S??DWEST', 'id': 246, 'trains': []},
            {'name': 'NORD-S??DOST-S??D', 'id': 247, 'trains': []},
            {'name': 'NORD-MITTE-S??DWEST', 'id': 256, 'trains': []},
            {'name': 'NORD-MITTE-S??D', 'id': 257, 'trains': []},
            {'name': 'NORD-S??DWEST-S??D', 'id': 267, 'trains': []},
            {'name': 'WEST-S??DOST-MITTE', 'id': 345, 'trains': []},
            {'name': 'WEST-S??DOST-S??DWEST', 'id': 346, 'trains': []},
            {'name': 'WEST-S??DOST-S??D', 'id': 347, 'trains': []},
            {'name': 'WEST-MITTE-S??DWEST', 'id': 356, 'trains': []},
            {'name': 'WEST-MITTE-S??D', 'id': 357, 'trains': []},
            {'name': 'WEST-S??DWEST-S??D', 'id': 367, 'trains': []},
            {'name': 'S??DOST-MITTE-S??DWEST', 'id': 456, 'trains': []},
            {'name': 'S??DOST-MITTE-S??D', 'id': 457, 'trains': []},
            {'name': 'S??DOST-S??DWEST-S??D', 'id': 467, 'trains': []},
            {'name': 'MITTE-S??DWEST-S??D', 'id': 567, 'trains': []}
        ];
    };

})();