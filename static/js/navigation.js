"use strict";

function searcher() {
    var _container = $('#search-container');
    var _departments;
    var _staff;

    $.ajax('/phonebook', {
        type: "GET",
        data: {fid:''},
        dataType: "json",
        success: function(departments) {
            _departments = departments;
            render();
        }
    });

    $.ajax('/phonebook', {
        type: "GET",
        data: {namelist : "y"},
        dataType: "json",
        success: function(staff) {
            _staff = staff;
        }
    });

    function render() {
        for (var i = 0; i < _departments.length; i++) {
            var department = document.createElement("div");
            department.className = 'search-department';
            department.innerHTML = _departments[i].dept_name.toUpperCase();

            var departmentContainer = document.createElement("div");
            departmentContainer.className = "search-department-container";
            departmentContainer.appendChild(department);

            if (_departments[i].dept_name.indexOf('Кафедра') + 1
                || _departments[i].dept_name.indexOf('Лаборатория') + 1
                || _departments[i].dept_name.indexOf('Департамент') + 1) {
                $('#search-chairs').get(0).appendChild(departmentContainer);
            }
            else if (_departments[i].dept_name.indexOf('Деканат') + 1) {
                $('#search-deans').get(0).appendChild(departmentContainer);
            }
            else if (_departments[i].dept_name.indexOf('Отдел') + 1
                || _departments[i].dept_name.indexOf('Центр') + 1) {
                $('#search-units').get(0).appendChild(departmentContainer);
            }
            else {
                $('#search-other').get(0).appendChild(departmentContainer);
            }
            $(departmentContainer).data('id', _departments[i].dept_id);
            $(departmentContainer).data('active', false);
        }
    }

    /** *********/

    function showNavigationMenu() {$('#search-container').fadeIn(200);}
    function hideNavigationMenu() {$('#search-container').fadeOut(200);}
    function showFullList() {$('#search-full-list-container').css("display", "block");}
    function hideFullList() {$('#search-full-list-container').css("display", "none");}
    function showSearchList() {$('#search-list-container').css("display", "block");}
    function hideSearchList() {$('#search-list-container').css("display", "none");}

    $('#search-close').click(hideNavigationMenu);

    /** *********/

    _container.on('click', '.search-department', function(event) {
        if (!$(event.target).data('active')) {
            $(event.target).data('active', true);
            $(event.target).addClass("search-department-active");
            var did = $(event.target.parentNode).data('id');
            $.ajax('/phonebook', {
                type: "GET",
                data: {did: did},
                dataType: "json",
                success: function(deptInfo) {
                    var employeeList = document.createElement("div");
                    employeeList.className = "search-employee-list";
                    event.target.parentNode.appendChild(employeeList);
                    for (var i = 0; i < deptInfo.staff.length; i++) {
                        var employee = document.createElement("div");
                        employee.className = "search-employee";
                        employee.innerHTML = deptInfo.staff[i].occupation + ' ' + deptInfo.staff[i].full_name;

                        var employeeContainer = document.createElement("div");
                        employeeContainer.className = "search-employee-container";
                        employeeContainer.appendChild(employee);

                        employeeList.appendChild(employeeContainer);
                        $(employeeContainer).data('id', deptInfo.staff[i].id);
                }
            }});
        } else {
            $(event.target).removeClass("search-department-active");
            $(event.target).siblings('.search-employee-list').remove();
            $(event.target).data('active', false);
        }
    });

    _container.on('mouseenter', '.search-employee-container', function() {
        $(this).children('.search-employee').addClass("search-employee-active");
        var locate = document.createElement("div");
        locate.className = "search-employee-locate";
        this.appendChild(locate);
        $(locate).data('id', $(this).data('id'));
    });

    _container.on('mouseleave', '.search-employee-container', function() {
        $(this).children('.search-employee').removeClass("search-employee-active");
        $(this).children('.search-employee-locate').remove();
    });

    _container.on('click', '.search-employee', function(event) {
        event.stopPropagation();
    });

    /** *********/

    function search() {
        var searchStr = $('#search-input-text').get(0).value;
        var foundSearchStr = '<span class="search-found">' + searchStr + '</span>';
        var slstaff = $('#search-list-staff');
        slstaff.html('<div class="search-column-h2">Сотрудники</div>');
        for (var i = 0; i < _staff.length; i++) {
            if (_staff[i].full_name.indexOf(searchStr) + 1) {
                var employee = document.createElement("div");
                employee.className = 'search-employee';
                employee.innerHTML = _staff[i].full_name.replace(searchStr, foundSearchStr);

                var employeeContainer = document.createElement("div");
                employeeContainer.className = 'search-employee-container';
                employeeContainer.appendChild(employee);

                slstaff.get(0).appendChild(employeeContainer);
                $(employeeContainer).data('id', _staff[i].id);
            }
        }

        searchStr = searchStr.toUpperCase();
        foundSearchStr = '<span class="search-found">' + searchStr + '</span>';
        var sldiv = $('#search-list-divisions');
        sldiv.html('<div class="search-column-h2">Подразделения</divclass>');
        for (i = 0; i < _departments.length; i++) {
            if (_departments[i].dept_name.toUpperCase().indexOf(searchStr) + 1) {
                var department = document.createElement("div");
                department.className = 'search-department';
                department.innerHTML = _departments[i].dept_name.toUpperCase().replace(searchStr, foundSearchStr);

                var departmentContainer = document.createElement("div");
                departmentContainer.className = 'search-department-container';
                departmentContainer.appendChild(department);

                sldiv.get(0).appendChild(departmentContainer);
                $(departmentContainer).data('id', _departments[i].dept_id);
            }
        }
    }

    var textInput = $('#search-input-text');
    textInput.focus(function() {
       hideFullList();
       showSearchList();
       search()
    });
    textInput.on('input', search);
    $('#search-input-submit').click(function () {
        hideSearchList();
        showFullList();
    });

    _container.ready(function() {
        showFullList();
        hideSearchList();
        hideNavigationMenu();
    });

    /** *********/

    return {
        showNavigationMenu: showNavigationMenu,
        hideNavigationMenu: hideNavigationMenu,
        showFullList: showFullList,
        hideFullList: hideFullList,
        showSearchList: showSearchList,
        hideSearchList: hideSearchList
    }
}