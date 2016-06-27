/**
 *  fork whit http://codyhouse.co/gem/horizontal-timeline/
 *  fix to jQuery
 */
;
(function($) {
    var private = {
        initControls: function(dom) {
            dom = private.setListStyle(dom);
            //重新构建整个结构
            var section = private.createSection();
            var timeline = private.createTimeLineDiv();
            var eventWrapper = private.createEventWrapperDiv();
            var event = private.createEventsDiv();
            var fillingspan = private.createFillingSpan();
            var navigation = private.createNavigationDiv();

            $('body').append(
                section.append(
                    timeline.append(
                        eventWrapper.append(
                            event.append(dom).append(fillingspan)
                        )
                    ).append(navigation)
                )
            );

            var timelineEvents = event.find('a');
            var timelineDates = private.parseDate(timelineEvents);
            var eventsMinLapse = private.minLapse(timelineDates);
            var eventsMinDistance = 60;

            var timelineComponents = {
                'timelineWrapper': eventWrapper,
                'eventsWrapper': event,
                'fillingLine': fillingspan,
                'timelineEvents': timelineEvents,
                'timelineDates': timelineDates,
                'eventsMinLapse': eventsMinLapse,
                'timelineNavigation': navigation
            };
            private.setDatePosition(timelineComponents, eventsMinDistance);
            var timelineTotWidth = private.setTimelineWidth(timelineComponents, eventsMinDistance);
            section.addClass('loaded');

            //detect click on the next arrow
            timelineComponents['timelineNavigation'].on('click', '.next', function(event) {
                event.preventDefault();
                private.updateSlide(timelineComponents, timelineTotWidth, 'next', eventsMinDistance);
            });
            //detect click on the prev arrow
            timelineComponents['timelineNavigation'].on('click', '.prev', function(event) {
                event.preventDefault();
                private.updateSlide(timelineComponents, timelineTotWidth, 'prev', eventsMinDistance);
            });
            //detect click on the a single event - show new event content
            timelineComponents['eventsWrapper'].on('click', 'a', function(event) {
                event.preventDefault();
                timelineComponents['timelineEvents'].removeClass('selected');
                $(this).addClass('selected');
                private.updateOlderEvents($(this));
                private.updateFilling($(this), timelineComponents['fillingLine'], timelineTotWidth);
            });
        },

        createSection: function() {
            var $section = $('<section></section>');
            $section.addClass('cd-horizontal-timeline');
            return $section;
        },
        createTimeLineDiv: function() {
            return createEmptyDivWithClass('timeline');
        },
        createEventWrapperDiv: function() {
            return createEmptyDivWithClass('events-wrapper');
        },
        createEventsDiv: function() {
            return createEmptyDivWithClass('events');
        },
        createFillingSpan: function() {
            var $span = $('<span></span>');
            $span.addClass('filling-line');
            $span.attr('aria-hidden', true);
            return $span;
        },
        setListStyle: function(list) {
            var $a = list.children();
            $a.first().children().addClass('selected');
            return list;
        },
        createNavigationDiv: function() {
            var $ul = $('<ul class="cd-timeline-navigation"></ul>');
            var $liPrev = $('<li><a href="#0" class="prev inactive">Prev</a></li>');
            var $liNext = $('<li><a href="#0" class="next">Next</a></li>');
            $ul.append($liPrev).append($liNext);
            return $ul;
        },
        parseDate: function(events) {
            var dateArrays = [];
            events.each(function() {
                var singleDate = $(this),
                    dateComp = singleDate.data('date').split('T');
                if (dateComp.length > 1) { //both DD/MM/YEAR and time are provided
                    var dayComp = dateComp[0].split('/'),
                        timeComp = dateComp[1].split(':');
                } else if (dateComp[0].indexOf(':') >= 0) { //only time is provide
                    var dayComp = ["2000", "0", "0"],
                        timeComp = dateComp[0].split(':');
                } else { //only DD/MM/YEAR
                    var dayComp = dateComp[0].split('/'),
                        timeComp = ["0", "0"];
                }
                var newDate = new Date(dayComp[2], dayComp[1] - 1, dayComp[0], timeComp[0], timeComp[1]);
                dateArrays.push(newDate);
            });
            return dateArrays;
        },
        daydiff: function(first, second) {
            return Math.round((second - first));
        },
        minLapse: function(dates) {
            //determine the minimum distance among events
            var dateDistances = [];
            for (i = 1; i < dates.length; i++) {
                var distance = private.daydiff(dates[i - 1], dates[i]);
                dateDistances.push(distance);
            }
            return Math.min.apply(null, dateDistances);
        },
        setDatePosition: function(timelineComponents, min) {
            for (i = 0; i < timelineComponents['timelineDates'].length; i++) {
                var distance = private.daydiff(timelineComponents['timelineDates'][0], timelineComponents['timelineDates'][i]),
                    distanceNorm = Math.round(distance / timelineComponents['eventsMinLapse']) + 2;
                timelineComponents['timelineEvents'].eq(i).css('left', distanceNorm * min + 'px');
            }
        },
        setTimelineWidth: function(timelineComponents, width) {
            var timeSpan = private.daydiff(timelineComponents['timelineDates'][0], timelineComponents['timelineDates'][timelineComponents['timelineDates'].length - 1]),
                timeSpanNorm = timeSpan / timelineComponents['eventsMinLapse'],
                timeSpanNorm = Math.round(timeSpanNorm) + 4,
                totalWidth = timeSpanNorm * width;
            timelineComponents['eventsWrapper'].css('width', totalWidth + 'px');
            private.updateFilling(timelineComponents['eventsWrapper'].find('a.selected'), timelineComponents['fillingLine'], totalWidth);
            private.updateTimelinePosition('next', timelineComponents['eventsWrapper'].find('a.selected'), timelineComponents);

            return totalWidth;
        },
        updateFilling: function(selectedEvent, filling, totWidth) {
            //change .filling-line length according to the selected event
            var eventStyle = window.getComputedStyle(selectedEvent.get(0), null),
                eventLeft = eventStyle.getPropertyValue("left"),
                eventWidth = eventStyle.getPropertyValue("width");
            eventLeft = Number(eventLeft.replace('px', '')) + Number(eventWidth.replace('px', '')) / 2;
            var scaleValue = eventLeft / totWidth;
            private.setTransformValue(filling.get(0), 'scaleX', scaleValue);
        },
        setTransformValue: function(element, property, value) {
            element.style["-webkit-transform"] = property + "(" + value + ")";
            element.style["-moz-transform"] = property + "(" + value + ")";
            element.style["-ms-transform"] = property + "(" + value + ")";
            element.style["-o-transform"] = property + "(" + value + ")";
            element.style["transform"] = property + "(" + value + ")";
        },
        updateTimelinePosition: function(string, event, timelineComponents) {
            //translate timeline to the left/right according to the position of the selected event
            var eventStyle = window.getComputedStyle(event.get(0), null),
                eventLeft = Number(eventStyle.getPropertyValue("left").replace('px', '')),
                timelineWidth = Number(timelineComponents['timelineWrapper'].css('width').replace('px', '')),
                timelineTotWidth = Number(timelineComponents['eventsWrapper'].css('width').replace('px', ''));
            var timelineTranslate = private.getTranslateValue(timelineComponents['eventsWrapper']);

            if ((string == 'next' && eventLeft > timelineWidth - timelineTranslate) || (string == 'prev' && eventLeft < -timelineTranslate)) {
                private.translateTimeline(timelineComponents, -eventLeft + timelineWidth / 2, timelineWidth - timelineTotWidth);
            }
        },
        getTranslateValue: function(timeline) {
            var timelineStyle = window.getComputedStyle(timeline.get(0), null),
                timelineTranslate = timelineStyle.getPropertyValue("-webkit-transform") ||
                timelineStyle.getPropertyValue("-moz-transform") ||
                timelineStyle.getPropertyValue("-ms-transform") ||
                timelineStyle.getPropertyValue("-o-transform") ||
                timelineStyle.getPropertyValue("transform");

            if (timelineTranslate.indexOf('(') >= 0) {
                var timelineTranslate = timelineTranslate.split('(')[1];
                timelineTranslate = timelineTranslate.split(')')[0];
                timelineTranslate = timelineTranslate.split(',');
                var translateValue = timelineTranslate[4];
            } else {
                var translateValue = 0;
            }

            return Number(translateValue);
        },
        translateTimeline: function(timelineComponents, value, totWidth) {
            var eventsWrapper = timelineComponents['eventsWrapper'].get(0);
            value = (value > 0) ? 0 : value; //only negative translate value
            value = (!(typeof totWidth === 'undefined') && value < totWidth) ? totWidth : value; //do not translate more than timeline width
            private.setTransformValue(eventsWrapper, 'translateX', value + 'px');
            //update navigation arrows visibility
            (value == 0) ? timelineComponents['timelineNavigation'].find('.prev').addClass('inactive'): timelineComponents['timelineNavigation'].find('.prev').removeClass('inactive');
            (value == totWidth) ? timelineComponents['timelineNavigation'].find('.next').addClass('inactive'): timelineComponents['timelineNavigation'].find('.next').removeClass('inactive');
        },
        updateSlide: function(timelineComponents, timelineTotWidth, string, eventsMinDistance) {
            //retrieve translateX value of timelineComponents['eventsWrapper']
            var translateValue = private.getTranslateValue(timelineComponents['eventsWrapper']),
                wrapperWidth = Number(timelineComponents['timelineWrapper'].css('width').replace('px', ''));
            //translate the timeline to the left('next')/right('prev') 
            (string == 'next') ? private.translateTimeline(timelineComponents, translateValue - wrapperWidth + eventsMinDistance, wrapperWidth - timelineTotWidth): private.translateTimeline(timelineComponents, translateValue + wrapperWidth - eventsMinDistance);
        },
        updateOlderEvents: function(event) {
            event.parent('li').prevAll('li').children('a').addClass('older-event').end().end().nextAll('li').children('a').removeClass('older-event');
        }
    }
    var createEmptyDivWithClass = function() {
        var className = arguments[0];
        var $div = $('<div></div>');
        $div.addClass(className);
        return $div;
    }

    $.fn.TimeLine = function() {
        private.initControls(this);
        return this;
    };
})(jQuery);
