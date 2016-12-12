'use strict';
var app = angular.module('app')

    .factory('audio', function ($document) {
        var audioElement = $document[0].getElementById('disconnection_player'); // <-- Magic trick here

        return {
            audioElement: audioElement,

            play: function (filename) {
                audioElement.src = filename;
                audioElement.play();     //  <-- That's all you need
            },
            playInLoop: function (filename) {
                audioElement.loop = true;
                audioElement.src = filename;
                audioElement.play();
            },
            stop: function () {
                audioElement.pause();
                audioElement.src = audioElement.currentSrc;
                /** http://stackoverflow.com/a/16978083/1015046 **/
            }
        }
    })
    .controller('HomeController', ['audio', 'CastReceiver', 'UserService', 'AuthenticationService', '$rootScope', '$scope', '$http', '$timeout','$sce',
        function (audio, CastReceiver, UserService, AuthenticationService, $rootScope, $scope, $http, $timeout) {

            $scope.advertisements = [];
            $scope.advertisement = {};

            $scope.doctors = [];
            $scope.doctor = {};
            $scope.docVisible = false;

            $scope.advVisible = false;

            $scope.flashQueue = [];
            $scope.flashBus = {};

            $scope.insideflash = false;
            $scope.device_doctors_map = [];

            $scope.is_doctor_connected = false;
            //   $scope.Appointment_time = Date(patientQueue.entrySlotTime * 1000);
            // $scope.In_time = Date(patientQueue.timeOfEntry );
            //////////////////////////////////////slack Call//////////////
            function post_log_on_slack(logtobeposted) {

                console.log("posting on slack: " + JSON.stringify(logtobeposted));

                var slack_post_ip = $scope.defconfig.ip_for_logs;
                var slack_post_port = $scope.defconfig.port_for_logs;
                $.ajax({
                    type: 'POST',
                    url: "http://" + slack_post_ip + ":" + slack_post_port + "/qlive/connection_test/v0.0.1/connect_disconnect",
                    dataType: "json",
                    data: JSON.stringify(logtobeposted),
                    contentType: 'application/json; charset=UTF-8',
                    //crossDomain: true,
                    success: function (msg) {

                    },
                    error: function (request, status, error) {

                    }

                });


            }

            function sender_is_connected(event) {
                var clinic_name_for_log = "";
                var doctor_name_for_log = "";
                var number_of_connected_devices = window.castReceiverManager.getSenders().length;
                for (var d_d_m = 0; d_d_m < $scope.device_doctors_map.length; d_d_m++) {
                    if ($scope.device_doctors_map[d_d_m].senderId === event.senderId) {
                        var doc_id_to_be_searched = $scope.device_doctors_map[d_d_m].doctorID;
                        for (var doc_index = 0; doc_index < $scope.doctors.length; doc_index++) {
                            if ($scope.doctors[doc_index].header.doctorID === doc_id_to_be_searched) {
                                $scope.doctors[doc_index].body.is_disconnected = false;
                                doctor_name_for_log = doctor_name_for_log + "," + $scope.doctors[doc_index].header.doctorName;
                                clinic_name_for_log = $scope.doctors[doc_index].header.cinicName;
                                //break;
                            }
                        }
                    }
                }
                var curr_date = new Date();
                var curr_time_millis = curr_date.getTime();
                var logtobeposted = {
                    type: "connection",
                    time: curr_time_millis,
                    clinicName: clinic_name_for_log,
                    doctorName: doctor_name_for_log,
                    connectedSenders: number_of_connected_devices,
                    event: event,
                    channel: "#qlive_connection_test",
                    collection: $scope.defconfig.connection_issue_collection
                };
                post_log_on_slack(logtobeposted)
            }


            function playDisconnectionSound() {
                console.log("playing disconnection sound");
                //   responsiveVoice.speak("disconnected","Hindi Female", {rate: 1.0});
                //   audio.play("sound")
                audio.playInLoop("sounds/alert.mp3");
                $timeout(function () {
                    audio.stop();
                }, 3000);
            }


            function playSound(text) {
                console.log("playing breaking news sound");
                // responsiveVoice.speak(text,"Hindi Female", {rate: 0.8});
                //  audio.play("sound")
            }

            /////////////Disconnection player End////////////////////////////////


            /////////////Breaking news player ////////////////////////////////


            function playbreakingnewssound() {
                audio.playInLoop("sounds/rail.mp3");
                $timeout(function () {
                    audio.stop();
                }, 5000);
            }

            /////////////Breaking news player End ////////////////////////////////


            function sender_is_disconnected(event) {
                var clinic_name_for_log = "";
                var doctor_name_for_log = "";
                var number_of_connected_devices = window.castReceiverManager.getSenders().length;
                //if (event.reason == cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
                for (var d_d_m = 0; d_d_m < $scope.device_doctors_map.length; d_d_m++) {
                    if ($scope.device_doctors_map[d_d_m].senderId === event.senderId) {
                        var empty_queue = {
                            header: {
                                doctorID: $scope.device_doctors_map[d_d_m].doctorID
                            },
                            body: {
                                queue: [],
                                is_disconnected: true
                            }
                        };

                        $scope.add_if_not_present(empty_queue);
                        //$scope.callback(data_for_queue);
                        //recently_received_queue_data.push(empty_queue);
                        var doc_id_to_be_searched = $scope.device_doctors_map[d_d_m].doctorID;
                        for (var doc_index = 0; doc_index < $scope.doctors.length; doc_index++) {
                            if ($scope.doctors[doc_index].header.doctorID === doc_id_to_be_searched) {
                                doctor_name_for_log = doctor_name_for_log + "," + $scope.doctors[doc_index].header.doctorName;
                                clinic_name_for_log = $scope.doctors[doc_index].header.cinicName;
                                $scope.doctors[doc_index].body.queue = [];
                                break;
                            }
                        }

                    }
                }
                //}
                var curr_date = new Date();
                var curr_time_millis = curr_date.getTime();
                var logtobeposted = {
                    type: "disconnect",
                    time: curr_time_millis,
                    clinicName: clinic_name_for_log,
                    doctorName: doctor_name_for_log,
                    connectedSenders: number_of_connected_devices,
                    event: event,
                    channel: "#qlive_connection_test",
                    collection: $scope.defconfig.connection_issue_collection
                };
                post_log_on_slack(logtobeposted)
                if (window.castReceiverManager.getSenders().length == 0 && event.reason == cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
                    //setTimeout(window.close,5000);
                }
            }

            function populate_device_doctormap(event) {
                var received_queue = JSON.parse(event.data)
                var device_with_doctor = {
                    senderId: event.senderId,
                    doctorID: received_queue.header.doctorID
                };
                var device_found = false;
                for (var d_w_d = 0; d_w_d < $scope.device_doctors_map.length; d_w_d++) {
                    if ($scope.device_doctors_map[d_w_d].doctorID === device_with_doctor.doctorID && $scope.device_doctors_map[d_w_d].senderId === device_with_doctor.senderId) {
                        device_found = true;
                    }
                }
                if (device_found == false) {
                    $scope.device_doctors_map.push(device_with_doctor);
                }
            }


                 //watch function to enable blinking for first user

            $scope.$watch('docVisible',function(newValue,oldValue,scope){
                           if(newValue)
                              $scope.isTrue=true;  
                            else
                              $scope.isTrue=false;
   
            },true);


            function post_ad_display_count(ad_data) {

                var ad_post_ip = $scope.defconfig.ip_for_logs;
                var ad_post_port = $scope.defconfig.port_for_logs;
                $.ajax({
                    type: 'POST',
                    url: "http://" + ad_post_ip + ":" + ad_post_port + "/qlive/connection_test/v0.0.1/count_ad",
                    dataType: "json",
                    data: JSON.stringify(ad_data),
                    contentType: 'application/json; charset=UTF-8',
                    //crossDomain: true,
                    success: function (msg) {

                    },
                    error: function (request, status, error) {

                    }

                });

            }


            //Google cast callback
            $scope.callback = function (data) {
                switch (data.dataType) {
                    case 'flashBus':
                        var flashdata = JSON.parse(data.data);
                        //$scope.flashQueue.push(flashdata);//
                        pushIfNotPresent(flashdata);
                        if (!$scope.insideflash) {
                            showFlash(0);
                        }
                        break;
                    //Add patient update
                    case 'queueBus':
                        $scope.add_if_not_present(JSON.parse(data.event.data));
                        populate_device_doctormap(data.event);
                        break;
                    case 'advertisementBus':
                        $scope.advertisementBus = data;
                        break;
                    case 'controlBus':
                        $scope.controlBus = data;
                        break;
                    case 'connected':
                        sender_is_connected(data.data);
                        $scope.is_doctor_connected = true;
                        break;
                    case 'disconnected':
                        sender_is_disconnected(data.data);
                        $scope.is_doctor_connected = false;
                        break;

                }
                $scope.$apply();
            };
            CastReceiver.initialize($scope.callback);


            //------------------filter Queue Logic

            /*********queue types**********/
            var QUEUE_TYPE_SCAN = 1001;
            var QUEUE_TYPE_ASSIST = 1002;
            var QUEUE_TYPE_DOCTOR = 1003;
            var QUEUE_TYPE_PROCESSED = 1004;
            //*********queue types end**********//

            //*********type of appointment********//
            $scope.fromWalkinQ = 136932;
            $scope.fromChekinQ = 132432;
            //*********type of appointment end********//

            //******patient status******//
            var STATUS_DONE = 101;
            var STATUS_ABANDON = 102;
            var STATUS_REMOVED = 103;
            var STATUS_IN_QUEUE = 104;
            $scope.filtered_queue = [];

            /*filter data of patient and doctor when update received*/

            $scope.add_if_not_present = function (data) {
                var already_present = false;
                var filtered_queue = filter_patients_in_queue(data.body.queue);
                data.body.queue = filtered_queue;
                for (var i = 0; i < $scope.doctors.length; i++) {
                    if (data.header.doctorID === $scope.doctors[i].header.doctorID) {
                        already_present = true;
                        $scope.doctors[i].body = data.body;
                        break;
                    }

                }
                if (!already_present) {
                    $scope.doctors.push(data);
                    $http.get('../' + data.header.clinicID + '.defaultconfig.json').success(function (data_from_configfile) {
                        //when you get success reset the advertisement
                        //$scope.defconfig = data;
                        $scope.advertisements_newly_added = data_from_configfile.defaultads;
                        if ($scope.advertisements_newly_added && $scope.advertisements) {

                            for (var j = 0; j < $scope.advertisements_newly_added.length; j++) {
                                var ad_already_present = false;
                                for (var i = 0; i < $scope.advertisements.length; i++) {
                                    if ($scope.advertisements[i].adId === $scope.advertisements_newly_added[j].adId) {

                                        ad_already_present = true;
                                        break;

                                    }
                                }
                                if (!ad_already_present) {
				    $scope.advertisements_newly_added[j].adUrl=$sce.trustAsResourceUrl($scope.advertisements_newly_added[j].adUrl)
                                    $scope.advertisements.push($scope.advertisements_newly_added[j]);
                                }
                            }

                            $scope.advertisements_newly_added = [];
                        }
                        /*for (var i = $scope.advertisements.length - 1; i >= 0; i--) {
                         $scope.advertisements[i].show = false;
                         if (i === 0)
                         $scope.advertisements[i].show = true;
                         }*/
                        //nextAd();
                        //showAdv();
                        //$scope.counter += 1;
                        //countDown();
                    });

                }
            };

            //function to get all the patients who are in type of QUEUE_TYPE_DOCTOR, QUEUE_TYPE_ASSIST and have status of STATUS_IN_QUEUE

            function filter_patients_in_queue(queue) {
                var filtered_queue = [];
                if (!queue)
                    return filtered_queue;

                for (var patient_number = 0; patient_number < queue.length; patient_number++) {
                    if (queue[patient_number].typeOfQueue === QUEUE_TYPE_DOCTOR || queue[patient_number].typeOfQueue === QUEUE_TYPE_ASSIST) {
                        if (queue[patient_number].status === STATUS_IN_QUEUE) {
                            filtered_queue.push(queue[patient_number]);
                        }
                    }
                }
                return filtered_queue;
            }

            /* end Filter Queue logic*/

            /****added for maintaining advertisement pointer****/
            var currentIndexForAd = -1;

            var currentIndexForDoc = -1;

            /****added for maintain advertisement****/
            function nextDoc() {
                currentIndexForDoc = currentIndexForDoc < $scope.doctors.length - 1 ? currentIndexForDoc + 1 : 0;
            }

            function nextAd() {
                currentIndexForAd = currentIndexForAd < $scope.advertisements.length - 1 ? currentIndexForAd + 1 : 0;
            }

            //business logic to show screens
            $scope.docVisible = false;
            $scope.advVisible = false;
            $scope.flashVisible = false;

            $scope.patientQueue = [];

            var prevIndex = 0;
            var prevIndex_backup = 0;

            function hideAllAds() {
                for (var i = 0; i < $scope.advertisements.length; i++) {
                    $scope.advertisements[i].show = false;
                }
            }

            function showDoc() {

                $scope.advertisements[currentIndexForAd].show = false;

                $scope.doctor = {};
                $scope.doctor = $scope.doctors[currentIndexForDoc];
                ////////////////Doc Splice Function ////////////////////////////////

                $scope.startIndex = prevIndex;
                var appointmentLeft = 0;


                if ($scope.doctor && $scope.doctor.body && $scope.doctor.body.queue) {
                    if ($scope.doctor.body.queue.length > 0) {

                        var diff = $scope.doctor.body.queue.length - (prevIndex + 1);
                        appointmentLeft = diff >= 6 ? 6 : $scope.doctor.body.queue.length;
                        $scope.patientQueue = [];
                        hideAllAds();
                        console.log("start index is " + $scope.startIndex + "appointment left" + appointmentLeft);
                        $scope.patientQueue = angular.copy($scope.doctor.body.queue.slice($scope.startIndex, $scope.startIndex + 6));

                        prevIndex_backup = prevIndex;
                        prevIndex = prevIndex + appointmentLeft;

                        if (diff >= 6) {
                            showDocExtra();

                        }
                    } else {
                        $scope.counter = 24;
                    }
                }


                $scope.advVisible = false;
                $scope.flashVisible = false;
                $scope.docVisible = true;
                if ($scope.doctor) {
                    console.log("doctor disconnected " + $scope.doctor.is_disconnected);
                    if ($scope.doctor.body.is_disconnected == true) {
                        playDisconnectionSound();
                    }
                }
            }

            var extra = 0;
            var extraTimeout;

            function showDocExtra() {
                extraTimeout = $timeout(function () {
                    if (extra === 18) {
                        extra = 0;
                        $scope.counter = 11;
                        showDoc();
                    }
                    else {
                        extra = extra + 1;
                        showDocExtra();
                    }

                }, 1000);
            }

            function showAdv() {

                $scope.advertisement = $scope.advertisements[currentIndexForAd];

                var curr_date = new Date();
                var curr_time_millis = curr_date.getTime();
                if ($scope.advertisement === undefined) {
                    console.log('config file not loaded');
                    return;

                }
                console.log("showing advertisement " + JSON.stringify($scope.advertisement));
                console.log("las displayed was " + $scope.advertisement.lastDisplayed);

                if ($scope.advertisement.show_ad === false) {
                    nextAd();
                    showAdv();
                    return;

                }

                if ((curr_time_millis - $scope.advertisement.lastDisplayed) < ($scope.advertisement.adIntervel * 1000)) {
                    nextAd();
                    showAdv();
                    return;
                }

                else {
                    $scope.docVisible = false;
                    $scope.flashVisible = false;
                    $scope.advVisible = true;
                    $scope.advertisements[currentIndexForAd].show = true;
                    $scope.advertisements[currentIndexForAd].lastDisplayed = curr_time_millis;
                }


                var clinicsforpost = [];
                var doctorsforpost = [];
                var patientsforpost = [];
                for (var doc in $scope.doctors) {
                    var clinic_already_exists = false;
                    for (var clinic in clinicsforpost) {
                        if (clinicsforpost[clinic].clinicID === $scope.doctors[doc].header.clinicID) {
                            clinic_already_exists = true;
                        }
                    }
                    if (!clinic_already_exists) {

                        var clinic_obj = {
                            clinicID: $scope.doctors[doc].header.clinicID,
                            clinicName: $scope.doctors[doc].header.cinicName
                        };
                        clinicsforpost.push(clinic_obj)
                    }
                    var doctor_already_exists = false;
                    for (var doctor in doctorsforpost) {
                        if (doctorsforpost[doctor].doctorID === $scope.doctors[doc].header.doctorID) {
                            doctor_already_exists = true;
                        }
                    }
                    if (!doctor_already_exists) {
                        var doctor_obj = {
                            doctorID: $scope.doctors[doc].header.doctorID,
                            doctorName: $scope.doctors[doc].header.doctorName
                        };
                        doctorsforpost.push(doctor_obj)
                    }
                    var queuedata = $scope.doctors[doc].body.queue;
                    for (var queueenty in queuedata) {
                        if (queuedata[queueenty].typeOfQueue == QUEUE_TYPE_DOCTOR || queuedata[queueenty].typeOfQueue == QUEUE_TYPE_ASSIST) {
                            var patient_obj = {
                                patientid: queuedata[queueenty].patientid,
                                patientName: queuedata[queueenty].patientName
                            }
                            patientsforpost.push(patient_obj);
                        }

                    }

                }
                var ad_details_for_posting = {
                    adId: $scope.advertisement.adId,
                    adName: $scope.advertisement.adName,
                    adStartTime: curr_time_millis,
                    clinics: clinicsforpost,
                    doctors: doctorsforpost,
                    patients: patientsforpost,
                    collection: $scope.defconfig.ad_count_collection


                };
                post_ad_display_count(ad_details_for_posting);

            }


            function pushIfNotPresent(received_flash_msg) {
                var already_present = false;
                for (var i = 0; i < $scope.flashQueue.length; i++) {
                    if (received_flash_msg.header.doctorID === $scope.flashQueue[i].header.doctorID && received_flash_msg.body.patientid === $scope.flashQueue[i].body.patientid) {
                        already_present = true;
                        break;
                    }
                }
                if (!already_present) {
                    $scope.flashQueue.push(received_flash_msg);
                }
            }


            function showFlash(flashindex) {
                $scope.advertisements[currentIndexForAd].show = false;


                $scope.docVisible = false;
                $scope.advVisible = false;
                $scope.insideflash = true;
                $scope.flashVisible = true;
                //playbreakingnewssound();

                stopCountDown();
                if ($scope.flashQueue.length <= 0) {

                    $scope.insideflash = false;
                    $timeout(function () {


                        if ($scope.counter <= 10) {
                            showAdv();
                        }
                        else if ($scope.counter <= 30) {
                            prevIndex = prevIndex_backup;
                            showDoc();

                        }

                        countDown();
                    }, 0);
                    //come out of breaking news
                }
                else if (flashindex >= $scope.flashQueue.length) {
                    $scope.flashQueue = [];
                    $scope.insideflash = false;
                    $timeout(function () {
                        if ($scope.counter <= 10)
                            showAdv();

                        else if ($scope.counter <= 30) {
                            prevIndex = prevIndex_backup;
                            showDoc();
                        }
                        countDown();
                    }, 0);
                    //come out of breaking news
                }
                else {
                    $scope.flashBus = $scope.flashQueue[flashindex];
                    hideAllAds();
                    playbreakingnewssound();
                    //playSound("Attention .  Token No. "+ $scope.flashBus.body.token + $scope.flashBus.body.patientName +  " . kripya Dr.  .  " + $scope.flashBus.header.doctorName + " ke pas jayea");

                    $timeout(function () {
                        showFlash(++flashindex)
                    }, 6000);
                }

            }


            // var TIMER_ADV = 10;
            // var TIMER_DOC= 20;
            // var TIMER_FLASH = 6000;
            $scope.counter = 0;
            var stopped;

            function stopCountDown() {
                $timeout.cancel(stopped);
                $timeout.cancel(extraTimeout);
            }

            function countDown() {
                stopped = $timeout(function () {
                    if ($scope.counter === 0) {
                        nextAd();
                        showAdv();
                    } else if ($scope.counter === 10) {
                        prevIndex = 0;
                        nextDoc();
                        showDoc();
                    } else if ($scope.counter === 30) {
                        $scope.counter = -1;
                    }
                    $scope.counter += 1;
                    countDown();
                }, 1000);
            }


            $http.get('../defaultconfig.json').success(function (data) {
                //when you get success reset the advertisement
                $scope.defconfig = data;
                $scope.advertisements = data.defaultads;
                for (var i = $scope.advertisements.length - 1; i >= 0; i--) {
                    $scope.advertisements[i].show = false;
		    $scope.advertisements[i].adUrl=$sce.trustAsResourceUrl($scope.advertisements[i].adUrl)
                    if (i === 0)
                        $scope.advertisements[i].show = true;
                }
                nextAd();
                showAdv();
                $scope.counter += 1;
                countDown();
            });

        }
    ])

    ///receiver code ............................
    .service('CastReceiver', function () {
        this.initialize = function (callback) {
            cast.receiver.logger.setLevelValue(0);
            function post_log_on_slack(logtobeposted) {

                console.log("posting on slack: " + JSON.stringify(logtobeposted));

                var slack_post_ip = "52.76.159.84";
                var slack_post_port = "8091";
                $.ajax({
                    type: 'POST',
                    url: "http://" + slack_post_ip + ":" + slack_post_port + "/qlive/connection_test/v0.0.1/connect_disconnect",
                    dataType: "json",
                    data: JSON.stringify(logtobeposted),
                    contentType: 'application/json; charset=UTF-8',
                    //crossDomain: true,
                    success: function (msg) {

                    },
                    error: function (request, status, error) {

                    }

                });


            }

            window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

            console.log('Starting Receiver Manager');

            // handler for the 'ready' event
            castReceiverManager.onReady = function (event) {
                console.log('Received Ready event: ' + JSON.stringify(event.data));
                window.castReceiverManager.setApplicationState("Application status is ready...");
            };

            // handler for 'senderconnected' event
            castReceiverManager.onSenderConnected = function (event) {
                console.log('Received Sender Connected event 22: ' + event.data);
                console.log(window.castReceiverManager.getSender(event.data).userAgent);
                callback({
                    dataType: 'connected',
                    data: event
                });

            };

            // handler for 'senderdisconnected' event
            castReceiverManager.onSenderDisconnected = function (event) {
                console.log('Received Sender Disconnected event: ' + event.data);

                callback({
                    dataType: 'disconnected',
                    data: event
                });

            };

            // handler for 'systemvolumechanged' event
            castReceiverManager.onSystemVolumeChanged = function (event) {
                console.log('Received System Volume Changed event: ' + event.data['level'] + ' ' +
                    event.data['muted']);
            };


            window.queueBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.qorql.qlive.queuebus');

            window.queueBus.onMessage = function (event) {
                console.log('Message [' + event.senderId + ']: ' + event.data);
                /**/

                // display the message from the sender
                callback({
                    dataType: 'queueBus',

                    event: event
                });
                // inform all senders on the CastMessageBus of the incoming message event
                // sender message listener will be invoked
                window.queueBus.send(event.senderId, event.data);
            };


            window.flashBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.qorql.qlive.flashbus');

            window.flashBus.onMessage = function (event) {
                console.log('Message [' + event.senderId + ']: ' + event.data);
                // display the message from the sender
                callback({
                    dataType: 'flashBus',
                    data: event.data
                });
                // inform all senders on the CastMessageBus of the incoming message event
                // sender message listener will be invoked
                window.flashBus.send(event.senderId, event.data);
            };


            window.advertisementBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.qorql.qlive.adbus');

            window.advertisementBus.onMessage = function (event) {
                console.log('Message [' + event.senderId + ']: ' + event.data);
                // display the message from the sender
                callback({
                    dataType: 'advertisementBus',
                    data: event.data
                });
                // inform all senders on the CastMessageBus of the incoming message event
                // sender message listener will be invoked
                window.advertisementBus.send(event.senderId, event.data);
            };

            window.controlBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:com.qorql.qlive.controlbus');

            window.controlBus.onMessage = function (event) {
                console.log('Message [' + event.senderId + ']: ' + event.data);
                // display the message from the sender
                callback({
                    dataType: 'controlBus',
                    data: event.data
                });
                // inform all senders on the CastMessageBus of the incoming message event
                // sender message listener will be invoked
                window.controlBus.send(event.senderId, event.data);
            };

            // initialize the CastReceiverManager with an application status message
            window.castReceiverManager.start({
                statusText: "Application is starting"
            });
            console.log('Receiver Manager started');
        }
    });

