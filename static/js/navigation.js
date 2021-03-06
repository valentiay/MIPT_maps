"use strict";

function navigation() {
    // Контейнер, содержащий навигацию
    var _navigationContainer = $('#search-container');
    // Информация об отделах
    var _departments;
    // Информация о сотрудниках
    var _staff;

    // Запрос информации об отделах
    $.ajax('/phonebook', {
        type: "GET",
        data: {fid:''},
        dataType: "json",
        beforeSend: function() {
            $("<div />", {
                "class": "navigation-loader loader"
            }).appendTo($("<div />", {
                "class": "navigation-loader-container"
            }).prependTo($('#search-full-list-container')));
        },
        error: function() {
            $('#search-full-list-container').children().remove(".navigation-loader-container");
            addError("Не удалось загрузить список отделов")
        },
        success: function(departments) {
            $('#search-full-list-container').children().remove(".navigation-loader-container");
            _departments = departments;
            renderDepartments();
        }
    });

    // Распределение отделов по категориям
    function renderDepartments() {
        for (var i = 0; i < _departments.length; i++) {
            var dept = $("<div />", {
                "class": "search-department",
                "text": _departments[i].dept_name.toUpperCase()
            });

            var deptContainer = $("<div />", {
                "class": "search-department-container"
            });
            deptContainer.data('id', _departments[i].dept_id);
            deptContainer.data('active', false);

            deptContainer.append(dept);
            var deptName = _departments[i].dept_name;

            if (deptName.indexOf('Кафедра') + 1
                || deptName.indexOf('Лаборатория') + 1
                || deptName.indexOf('Департамент') + 1) {
                $('#search-chairs').append(deptContainer);
            } else if (deptName.indexOf('Деканат') + 1) {
                $('#search-deans').append(deptContainer);
            } else if (deptName.indexOf('Отдел') + 1
                || deptName.indexOf('Центр') + 1) {
                $('#search-units').append(deptContainer);
            } else {
                $('#search-other').append(deptContainer);
            }
        }
    }

    // Запрос информации о сотрудниках
    $.ajax('/phonebook', {
        type: "GET",
        data: {namelist : "y"},
        dataType: "json",
        beforeSend: function() {
            $("<div />", {
                "class": "navigation-loader loader"
            }).appendTo($("<div />", {
                "class": "navigation-loader-container"
            }).prependTo($('#search-list-container')));
        },
        error: function() {
            $('#search-list-container').children().remove(".navigation-loader-container");
            addError("Не удалось загрузить список сотрудников")
        },
        success: function(staff) {
            $('#search-list-container').children().remove(".navigation-loader-container");
            _staff = staff;
        }
    });

    /** Переключение между выбором и поиском */

    function showSearchListOnInput(event) {
        $("#search-input-text").focus();
        hideFullList();
        showSearchList();
        search();
        $(window).off("keypress", showSearchListOnInput);
    }

    function showNavigationMenu() {
        _navigationContainer.fadeIn(200);
        $(window).keypress(showSearchListOnInput);
    }

    function hideNavigationMenu() {
        $('#search-container').fadeOut(200);
        $(window).off("keypress", showSearchListOnInput);
    }


    function showFullList() {$('#search-full-list-container').css("display", "block");}
    function hideFullList() {$('#search-full-list-container').css("display", "none");}
    function showSearchList() {
        $('#search-list-container').css("display", "block");
        $(window).off("keypress", showSearchListOnInput);
    }
    function hideSearchList() {
        $('#search-list-container').css("display", "none");
        $(window).keypress(showSearchListOnInput);
    }

    $('#search-close').click(hideNavigationMenu);

    /** Выбор отдела */

    // Разворачивет/сворачивет список сотрудников в отделе
    _navigationContainer.on('click', '.search-department', function(event) {
        var deptLabel = $(event.target);
        var deptContainer = $(event.target.parentNode);
        function requestForEmployees(did, retry) {
            if (retry !== undefined) {
                addError("Не удалось загрузить список сотрудников");
                return;
            }

            $.ajax('/phonebook', {
                type: "GET",
                data: {did: did},
                dataType: "json",
                beforeSend: function () {
                    $("<div />", {
                        "class": "search-loader loader"
                    }).appendTo($("<div />", {
                        "class": "search-loader-container"
                    }).appendTo(deptContainer));
                },
                error: function () {
                    deptContainer.children(":not(.search-department, span)").remove();
                    requestForEmployees(did, true);
                },
                success: function (deptInfo) {
                    if (!deptLabel.hasClass('search-department-active'))
                        return;
                    deptContainer.children(":not(.search-department, span)").remove();
                    var employeeList = $("<div />", {
                        "class": "search-employee-list"
                    });
                    deptContainer.append(employeeList);
                    for (var i = 0; i < deptInfo.staff.length; i++) {
                        if (deptInfo.staff[i] instanceof Array) {
                            deptInfo.staff[i].forEach(function (elem) {
                                addEmployee(employeeList, elem);
                            });
                        } else {
                            addEmployee(employeeList, deptInfo.staff[i]);
                        }
                    }
                }
            });
        }

        if (!deptLabel.data('active')) {
            deptLabel.data('active', true);
            deptLabel.addClass("search-department-active");
            requestForEmployees(deptContainer.data('id'));
        } else {
            deptLabel.removeClass("search-department-active");
            deptLabel.siblings(":not(.search-department)").remove();
            deptLabel.data('active', false);
        }
    });

    // Добавляет сотрудника в список сотрудников
    function addEmployee(employeeList, elem) {
        var text = "";
        if (elem.occupation !== null) {
            text += elem.occupation + " ";
        }
        if (elem.full_name !== null) {
            text += elem.full_name;
        }


        var employeeDiv = $("<div />", {
            "class": "search-employee",
            "text": text
        });

        var employeeDivContainer = $("<div />", {
            "class": "search-employee-container"
        });
        employeeDivContainer.data("id", elem.id);

        employeeDivContainer.append(employeeDiv);
        employeeList.append(employeeDivContainer);
    }

    /** Выбор сотрудника */

    // Подсвечивает сотрудника при наведении мышкой
    _navigationContainer.on('mouseenter', '.search-employee-container', function(event) {
        var container = $(event.currentTarget);
        container.children('.search-employee').addClass("search-employee-active");
        $("<div />", {
            "class": "search-employee-locate"
        }).data("id", container.data('id')).appendTo(container);
    });

    // Снимает подсветку
    _navigationContainer.on('mouseleave', '.search-employee-container', function(event) {
        var container = $(event.currentTarget);
        container.children('.search-employee').removeClass("search-employee-active");
        container.children('.search-employee-locate').remove();
    });

    _navigationContainer.on('click', '.search-employee', function(event) {
        event.stopPropagation();
    });

    /** Поиск сотрудника/отдела/кабинета */

    // Выводит список сотрудников и отделов с подсвеченной ключевой подстрокой
    function search() {
        if (_staff === undefined)
            return;
        var request = $('#search-input-text').val().toLowerCase();
        var searchListStaff = $('#search-list-staff');
        searchListStaff.html('<div class="search-column-h2">Сотрудники</div>');

        for (var i = 0; i < _staff.length; i++) {
            var index = 0;
            var employeeText = _staff[i].full_name;
            if ((index = employeeText.toLowerCase().indexOf(request)) + 1) {
                var employee = $("<div />", {
                    "class": "search-employee"
                });
                employee.html(
                    employeeText.substring(0, index) +
                    "<span class='search-found'>" +
                    employeeText.substring(index, index + request.length) +
                    "</span>" + employeeText.substring(index + request.length));

                var employeeContainer = $("<div />", {
                    "class": "search-employee-container"
                });
                employeeContainer.data('id', _staff[i].id[0]);

                employeeContainer.append(employee);
                searchListStaff.append(employeeContainer);
            }
        }

        request = request.toUpperCase();
        var searchListDivisions = $('#search-list-divisions');
        searchListDivisions.html('<div class="search-column-h2">Подразделения</divclass>');
        for (i = 0; i < _departments.length; i++) {
            var deptText = _departments[i].dept_name.toUpperCase();
            if ((index = deptText.indexOf(request)) + 1) {
                var dept = $("<div />",{
                    "class": "search-department"
                });
                dept.html(
                    deptText.substring(0, index) +
                    "<span class='search-found'>" +
                    deptText.substring(index, index + request.length) +
                    "</span>" + deptText.substring(index + request.length));

                var deptContainer = $("<div />", {
                    "class": "search-department-container"
                });
                deptContainer.data('id', _departments[i].dept_id);

                deptContainer.append(dept);
                searchListDivisions.append(deptContainer);
            }
        }
    }

    var cabinetQuestion = $('#navigation-search-cabinet-question');
    var cabinetHelp = $('#navigation-search-cabinet-help');
    cabinetQuestion.mouseenter(function() {
        cabinetHelp.hide().slideDown(200);
    });
    cabinetQuestion.mouseleave(function() {
        cabinetHelp.show().slideUp(200);
    });

    // Выводит список сотрудников при фокусе на строку поиска
    var searchInput = $('#search-input-text');
    searchInput.focus(function() {
       hideFullList();
       showSearchList();
       search()
    });

    // Ищет сотудников при изменении текста в строке поиска
    searchInput.on('input', search);

    // Выводит список сотрудников при нажатии на крест
    $('#search-input-submit').click(function () {
        hideSearchList();
        showFullList();
    });

    _navigationContainer.ready(function() {
        showFullList();
        hideSearchList();
        hideNavigationMenu();
    });

    return {
        showNavigationMenu: showNavigationMenu,
        hideNavigationMenu: hideNavigationMenu,
        showFullList: showFullList,
        hideFullList: hideFullList,
        showSearchList: showSearchList,
        hideSearchList: hideSearchList
    }
}