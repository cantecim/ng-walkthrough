var scripts = document.getElementsByTagName("script");
var currentScriptPath = scripts[scripts.length-1].src;
var templateUrl = currentScriptPath.replace(new RegExp("ng-walkthrough.js.*"), 'ng-walkthrough.html');
var iconsUrl = currentScriptPath.replace(new RegExp("ng-walkthrough.js.*"), 'icons/');

angular.module('ng-walkthrough', [])
    .directive("walkthrough", function($log, $timeout) {
        var DOM_WALKTHROUGH_TEXT_CLASS = ".walkthrough-text";
        var DOM_WALKTHROUGH_HOLE_CLASS = ".walkthrough-hole";
        var DOM_WALKTHROUGH_ICON_CLASS = ".walkthrough-icon";
        var DOM_WALKTHROUGH_ARROW_CLASS = ".walkthrough-arrow";
        var DOM_WALKTHROUGH_BACKGROUND_CLASS = "walkthrough-background";
        var DOM_WALKTHROUGH_DONE_BUTTON_CLASS = "walkthrough-done-button";
        var BUTTON_CAPTION_DONE = "Got it!";
        var PADDING_HOLE = 5;
        var PADDING_ARROW_START = 5;
        var gestureIcons = ["single_tap", "double_tap", "swipe_down", "swipe_left", "swipe_right", "swipe_up"];

        return {
            restrict: 'E',
            transclude: true,
            scope: {
                isActive: '=',
                icon: '@',
                focusElementId: '@',
                mainCaption: '@',
                isRound: '=',
                useButton: '=',
                iconPaddingLeft: '@',
                iconPaddingTop: '@',
                onWalkthroughShow: '&',
                onWalkthroughHide: '&',
                focusMarginTop: '='
            },
            link: function (scope, element, attrs, ctrl, $transclude) {
                var getIcon = function(icon){
                    var retval = null;
                    switch (icon){
                        case ("single_tap"):
                            retval = iconsUrl + "Single_Tap.png";
                            break;
                        case ("double_tap"):
                            retval = iconsUrl + "Double_Tap.png";
                            break;
                        case ("swipe_down"):
                            retval = iconsUrl + "Swipe_Down.png";
                            break;
                        case ("swipe_left"):
                            retval = iconsUrl + "Swipe_Left.png";
                            break;
                        case ("swipe_right"):
                            retval = iconsUrl + "Swipe_Right.png";
                            break;
                        case ("swipe_up"):
                            retval = iconsUrl + "Swipe_Up.png";
                            break;
                        case ("arrow"):
                            retval = ""; //Return nothing, using other dom element for arrow
                            break;
                    }
                    if (retval == null && icon && icon.length > 0){
                        retval = icon;
                    }
                    return retval;
                };

                var init = function(scope){
                    scope.clickEvent = 'click';
                    //noinspection JSUnresolvedVariable
                    if (typeof ionic !== 'undefined') { //Might need to comment this out if fails build on angular only machine
                        scope.clickEvent = 'touch';
                    }

                    //Event to close the walkthrough
                    scope.closeWalkthrough = function(){
                        scope.isActive = false;
                        scope.onWalkthroughHide();
                    };

                    //Event used when background clicked, if we use button then do nothing
                    scope.onCloseClicked = function($event) {
                        //if Angular only
                        if (scope.clickEvent == 'click') {
                            if (($event.currentTarget.className.indexOf(DOM_WALKTHROUGH_BACKGROUND_CLASS) > -1 && !scope.useButton) ||
                                ($event.currentTarget.className.indexOf(DOM_WALKTHROUGH_DONE_BUTTON_CLASS) > -1 && scope.useButton)) {
                                scope.closeWalkthrough();
                            }
                        }
                        $event.stopPropagation();
                    };

                    scope.onCloseTouched = function($event) {
                        if (scope.clickEvent == 'touch') {
                            if (($event.currentTarget.className.indexOf(DOM_WALKTHROUGH_BACKGROUND_CLASS) > -1 && !scope.useButton) ||
                                ($event.currentTarget.className.indexOf(DOM_WALKTHROUGH_DONE_BUTTON_CLASS) > -1 && scope.useButton)) {
                                scope.closeWalkthrough();
                            }
                        }
                        $event.stopPropagation();
                    };

                    scope.walkthroughIcon = getIcon(scope.icon);
                    scope.buttonCaption = BUTTON_CAPTION_DONE;
                };

                //Sets the walkthrough focus hole on given params with padding
                var setFocus = function(left, top, width, height){
                    top += scope.focusMarginTop;
                    var holeDimensions =
                        "left:" + (left - PADDING_HOLE) + "px;" +
                        "top:" + (top - PADDING_HOLE) + "px;" +
                        "width:" + (width + (2 * PADDING_HOLE)) + "px;" +
                        "height:" + (height + (2 * PADDING_HOLE)) + "px;";
                    scope.walkthroughHoleElement.attr('style', holeDimensions);
                };

                var moveTextToBottom = function(newTop){
                    var textLocation =
                        "top:" + newTop + "px;" +
                        "margin-top: 10px;";
                    scope.walkthroughTextElement.attr('style', textLocation);
                };

                //Check if given icon covers text
                var isItemOnText = function(iconLeft, iconTop, iconRight, iconBottom) {
                    var retval = false;
                    var textLeft = scope.walkthroughTextElement[0].offsetLeft;
                    var textRight = scope.walkthroughTextElement[0].offsetLeft + scope.walkthroughTextElement[0].offsetWidth;
                    var textTop = scope.walkthroughTextElement[0].offsetTop;
                    var textBottom = scope.walkthroughTextElement[0].offsetTop + scope.walkthroughTextElement[0].offsetHeight;
                    if (!(textRight < iconLeft ||
                        textLeft > iconRight ||
                        textBottom < iconTop ||
                        textTop > iconBottom)) {
                        retval = true;
                    }
                    return retval;
                };

                //Sets the icon displayed according to directive argument
                var setIconAndText = function(iconLeft, iconTop, paddingLeft, paddingTop){
                    iconTop += scope.focusMarginTop;
                    var iconHeight = scope.walkthroughIconElement[0].offsetHeight;
                    var iconWidth = scope.walkthroughIconElement[0].offsetWidth;
                    var iconLeftWithPadding = iconLeft + paddingLeft;
                    var iconTopWithPadding = iconTop + paddingTop;
                    var iconRight = iconLeftWithPadding + iconWidth;
                    var iconBottom = iconTopWithPadding + iconHeight;

                    //Check if text overlaps icon, if does, move it to bottom
                    if (isItemOnText(iconLeftWithPadding, iconTopWithPadding, iconRight, iconBottom)){
                        moveTextToBottom(iconBottom);
                    }

                    var iconLocation =
                        "position: absolute;" +
                        "left:" + iconLeftWithPadding + "px;" +
                        "top:" + iconTopWithPadding + "px;" +
                        "margin-top:-" + iconHeight/6 + "px;" +
                        "margin-left:-" + iconWidth/4 + "px;";
                    scope.walkthroughIconElement.attr('style', iconLocation);
                };

                var setArrowAndText = function(pointSubjectLeft, pointSubjectTop, pointSubjectWidth, pointSubjectHeight, paddingLeft){
                    var startLeft = scope.walkthroughTextElement[0].offsetLeft + scope.walkthroughTextElement[0].offsetWidth /2;
                    var startTop = scope.walkthroughTextElement[0].offsetTop + scope.walkthroughTextElement[0].offsetHeight + PADDING_ARROW_START;

                    var endTop = 0;
                    var endLeft = 0;

                    if (startLeft > pointSubjectLeft){//If hole left to text set arrow to point to middle right
                        endLeft = pointSubjectLeft + paddingLeft + pointSubjectWidth;
                        endTop = pointSubjectTop + (pointSubjectHeight/2);
                    } else if (startLeft < pointSubjectLeft){//If hole right to text set arrow to point to middle left
                        endLeft = pointSubjectLeft - paddingLeft;
                        endTop = pointSubjectTop + (pointSubjectHeight/2);
                    }

                    //Check if text overlaps icon, if does, move it to bottom
                    if (isItemOnText(startLeft, startTop, endLeft, endTop)){
                        moveTextToBottom(startTop);
                    }

                    var arrowSvgDom =
                        '<svg width="100%" height="100%">' +
                        '<defs>' +
                        '<marker id="arrow" markerWidth="13" markerHeight="13" refx="2" refy="6" orient="auto">' +
                        '<path d="M2,1 L2,10 L10,6 L2,2" style="fill:#fff;" />' +
                        '</marker>' +
                        '</defs>' +
                        '<path d="M' + startLeft + ',' + startTop + ' Q' + startLeft + ',' + endTop + ' ' + endLeft + ',' + endTop + '"' +
                        'style="stroke:#fff; stroke-width: 2px; fill: none;' +
                        'marker-end: url(#arrow);"/>' +
                        '/>' +
                        '</svg>';


                    scope.walkthroughArrowElement.append(arrowSvgDom);
                };

                //Attempts to highlight the given element ID and set Icon to it if exists, if not use default - right under text
                var setElementLocations = function(walkthroughIconWanted, focusElementId, iconPaddingLeft, iconPaddingTop){
                    var focusElement = document.querySelector('#' + focusElementId);
                    var angularElement = angular.element(focusElement);
                    if (angularElement.length > 0) {
                        var width = angularElement[0].offsetWidth;
                        var height = angularElement[0].offsetHeight;
                        var left = $(focusElement).offset().left;
                        var top = $(focusElement).offset().top;
                        setFocus(left, top, width, height);
                        var paddingLeft = parseFloat(iconPaddingLeft);
                        var paddingTop = parseFloat(iconPaddingTop);
                        if (!paddingLeft) { paddingLeft = 0;}
                        if (!paddingTop) { paddingTop = 0;}

                        //If Gesture icon given bind it to hole as well
                        if (gestureIcons.indexOf(walkthroughIconWanted) > -1){
                            setIconAndText(left + width/2, top  + height/2, paddingLeft, paddingTop);
                        }
                        if (walkthroughIconWanted == "arrow"){
                            setArrowAndText(left, top + paddingTop, width, height, paddingLeft);
                        }
                    } else {
                        $log.info('Unable to find element requested to be focused: #' + focusElementId);
                    }
                };

                scope.walkthroughHoleElement = angular.element(element[0].querySelector(DOM_WALKTHROUGH_HOLE_CLASS));
                scope.walkthroughTextElement = angular.element(element[0].querySelector(DOM_WALKTHROUGH_TEXT_CLASS));
                scope.walkthroughIconElement = angular.element(element[0].querySelector(DOM_WALKTHROUGH_ICON_CLASS));
                scope.walkthroughArrowElement = angular.element(element[0].querySelector(DOM_WALKTHROUGH_ARROW_CLASS));
                $transclude(function(clone){
                    init(scope);
                    var transcludeContent = clone.text().trim();
                    if (!(transcludeContent.length == 0 && clone.length <= 1)) { //Transcluding
                        scope.hasTransclude = true;
                    }
                });

                scope.$watch('isActive', function(newValue){
                    if(newValue){
                        if (!scope.hasTransclude){
                            //Must timeout to make sure we have final correct coordinates after screen totally load
                            $timeout(function() {setElementLocations(scope.icon, attrs.focusElementId, scope.iconPaddingLeft, scope.iconPaddingTop)},0);
                        }
                        scope.onWalkthroughShow();
                    }
                });
            },
            templateUrl: templateUrl
        };
    });
