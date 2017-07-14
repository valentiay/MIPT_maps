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
        success: function(departments) {
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

            if (_departments[i].dept_name.indexOf('Кафедра') + 1
                || _departments[i].dept_name.indexOf('Лаборатория') + 1
                || _departments[i].dept_name.indexOf('Департамент') + 1) {
                $('#search-chairs').append(deptContainer);
            } else if (_departments[i].dept_name.indexOf('Деканат') + 1) {
                $('#search-deans').append(deptContainer);
            } else if (_departments[i].dept_name.indexOf('Отдел') + 1
                || _departments[i].dept_name.indexOf('Центр') + 1) {
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
        success: function(staff) {
            _staff = staff;
        }
    });

    /** Переключение между выбором и поиском */

    function showNavigationMenu() {$('#search-container').fadeIn(200);}
    function hideNavigationMenu() {$('#search-container').fadeOut(200);}
    function showFullList() {$('#search-full-list-container').css("display", "block");}
    function hideFullList() {$('#search-full-list-container').css("display", "none");}
    function showSearchList() {$('#search-list-container').css("display", "block");}
    function hideSearchList() {$('#search-list-container').css("display", "none");}

    $('#search-close').click(hideNavigationMenu);

    /** Выбор отдела */

    // Разворачивет/сворачивет список сотрудников в отделе
    _navigationContainer.on('click', '.search-department', function(event) {
        var deptLabel = $(event.target);
        var deptContainer = $(event.target.parentNode);
        if (!deptLabel.data('active')) {
            deptLabel.data('active', true);
            deptLabel.addClass("search-department-active");
            var did = deptContainer.data('id');
            $.ajax('/phonebook', {
                type: "GET",
                data: {did: did},
                dataType: "json",
                beforeSend: function() {
                    $("<div />", {
                        "class": "search-loader loader"
                    }).appendTo($("<div />", {
                        "class": "search-loader-container"
                    }).appendTo(deptContainer));
                },
                success: function(deptInfo) {
                    if (!deptLabel.hasClass('search-department-active'))
                        return;
                    deptContainer.children(":not(.search-department)").remove();
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
                },
                error: function() {
                    alert("something gone wrong")
                }
            });
        } else {
            deptLabel.removeClass("search-department-active");
            deptLabel.siblings(":not(.search-department)").remove();
            deptLabel.data('active', false);
        }
    });

    // Добавляет сотрудника в список сотрудников
    function addEmployee(employeeList, elem) {
        if (elem.occupation === null || elem.full_name === null)
            return;

        var employeeDiv = $("<div />", {
            "class": "search-employee",
            "text": elem.occupation + ' ' + elem.full_name
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

    /** Поиск сотрудника/отдела */

    // Выводит список сотрудников и отделов с подсвеченной ключевой подстрокой
    function search() {
        var searchStr = $('#search-input-text').val();
        var highlightedStr = '<span class="search-found">' + searchStr + '</span>';
        var searchListStaff = $('#search-list-staff');
        searchListStaff.html('<div class="search-column-h2">Сотрудники</div>');
        for (var i = 0; i < _staff.length; i++) {
            if (_staff[i].full_name.indexOf(searchStr) + 1) {
                var employee = $("<div />", {
                    "class": "search-employee"
                });
                employee.html(_staff[i].full_name.replace(searchStr, highlightedStr));

                var employeeContainer = $("<div />", {
                    "class": "search-employee-container"
                });
                employeeContainer.data('id', _staff[i].id);

                employeeContainer.append(employee);
                searchListStaff.append(employeeContainer);
            }
        }

        searchStr = searchStr.toUpperCase();
        highlightedStr = '<span class="search-found">' + searchStr + '</span>';
        var searchListDivisions = $('#search-list-divisions');
        searchListDivisions.html('<div class="search-column-h2">Подразделения</divclass>');
        for (i = 0; i < _departments.length; i++) {
            if (_departments[i].dept_name.toUpperCase().indexOf(searchStr) + 1) {
                var dept = $("<div />",{
                    "class": "search-department"
                });
                dept.html(_departments[i].dept_name.toUpperCase().replace(searchStr, highlightedStr));

                var deptContainer = $("<div />", {
                    "class": "search-department-container"
                });
                deptContainer.data('id', _departments[i].dept_id);

                deptContainer.append(dept);
                searchListDivisions.append(deptContainer);
            }
        }
    }

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