/*******************************************************************************
Custom JS application specific
*******************************************************************************/
//#region Add Namespace
app.build = app.build || {};
app.build.create.dimension = {};
app.build.create.dimension.modal = {};
app.build.create.dimension.ajax = {};
app.build.create.dimension.callback = {};
app.build.create.dimension.validation = {};
app.build.create.dimension.propertiesValid = false;
app.build.create.dimension.statisticsManualValid = false;
app.build.create.dimension.statisticsUploadValid = false;
app.build.create.dimension.periodsManualValid = true;






//#endregion

//#region build format dropdown
/**
 *Call Ajax for read format
 */
app.build.create.dimension.ajax.readFormat = function () {
    api.ajax.jsonrpc.request(
        app.config.url.api.private,
        "PxStat.System.Settings.Format_API.Read",
        {
            "LngIsoCode": null,
            "FrmDirection": C_APP_TS_FORMAT_DIRECTION_UPLOAD
        },
        "app.build.create.dimension.callback.readFormat"
    );
};

/**
 * Callback for read
 * @param {*} response
 */
app.build.create.dimension.callback.readFormat = function (response) {
    if (response.error) {
        // Handle the Error in the Response first
        api.modal.error(response.error.message);
    }

    else if (!response.data || (Array.isArray(response.data) && !response.data.length)) {
        api.modal.information(app.label.static["api-ajax-nodata"]);
    }
    else if (response.data) {
        app.build.create.dimension.callback.drawFormat(response.data);
    }
    // Handle Exception
    else api.modal.exception(app.label.static["api-ajax-exception"]);
};

/**
 * Draw dropdown
 * @param {*} response
 */
app.build.create.dimension.callback.drawFormat = function (response) {
    $.each(response, function (index, format) {
        var formatDropdown = $("#build-create-dimension-metadata-templates").find("[name=create-submit]").clone();
        formatDropdown.attr(
            {
                "frm-type": format.FrmType,
                "frm-version": format.FrmVersion
            });

        formatDropdown.find("[name=type]").text(format.FrmType);
        formatDropdown.find("[name=version]").text(format.FrmVersion);

        $("#build-create-matrix-dimensions [name=format-list]").append(formatDropdown);
    });

    $("#build-create-matrix-dimensions").find("[name=create-submit]").once("click", function (e) {
        e.preventDefault();
        $.each(app.build.create.initiate.languages, function (key, language) {
            $("#build-create-dimension-accordion-" + language.code).find("[type=submit]").trigger("click");
        });
        if (app.build.create.dimension.propertiesValid) {
            app.build.create.initiate.data.FrmType = $(this).attr("frm-type");
            app.build.create.initiate.data.FrmVersion = $(this).attr("frm-version");
            app.build.create.dimension.buildDataObject();
        };
    });
};
//#endregion
//#region draw tabs 
app.build.create.dimension.drawTabs = function () {
    //each accordion must have unique id to toggle, each collapse must unique id. Use language code to build unique id's

    $("#build-create-dimensions").find("[name=dimension-error-card]").hide();
    $("#build-create-dimensions").find("[name=nav-tab]").empty();
    $("#build-create-dimensions").find("[name=tab-content]").empty();
    // Tabs item item
    $.each(app.build.create.initiate.languages, function (key, value) {
        var tabLanguageItem = $("#build-create-dimension-metadata-templates").find("[name=nav-lng-tab-item]").clone(); // Tabs item item
        //Set values
        tabLanguageItem.attr("lng-iso-code", value.code);
        tabLanguageItem.attr("id", "build-create-dimension-nav-" + value.code + "-tab");
        tabLanguageItem.attr("href", "#build-create-dimension-nav-" + value.code);
        tabLanguageItem.attr("aria-controls", "nav-" + value.code);
        tabLanguageItem.text(value.name);
        if (key === 0) {
            tabLanguageItem.addClass("active show");
        }
        $("#build-create-dimensions #nav-tab").append(tabLanguageItem.get(0).outerHTML);
        var tabContent = $("#build-create-dimension-metadata-templates").find("[name=nav-lng-tab-item-content]").clone();
        tabContent.attr("id", "build-create-dimension-nav-" + value.code);

        tabContent.find("[name=delete-all-statistics]").attr("lng-iso-code", value.code).attr("lng-iso-name", value.name);
        tabContent.find("[name=delete-all-classifications]").attr("lng-iso-code", value.code).attr("lng-iso-name", value.name);
        tabContent.find("[name=delete-all-periods]").attr("lng-iso-code", value.code).attr("lng-iso-name", value.name);

        tabContent.attr("lng-iso-code", value.code);
        if (key === 0) {
            tabContent.addClass("active show");
        }
        tabContent.find(".accordion").attr("id", "build-create-dimension-accordion-" + value.code);
        $.each(tabContent.find("[name=dimension-collapse]"), function () {
            $(this).find(".collapse").attr("data-parent", "#" + "build-create-dimension-accordion-" + value.code);
            $(this).find(".collapse").attr("id", "build-create-dimension-accordion-collapse-" + $(this).attr("card") + "-" + value.code);
            $(this).find(".card-header").find(".btn-link").attr("data-target", "#build-create-dimension-accordion-collapse-" + $(this).attr("card") + "-" + value.code);
            $(this).find(".card-header").find(".btn-link").attr("aria-controls", "collapse-" + $(this).attr("card"));
        });


        $("#build-create-matrix-dimensions").find("[name=tab-content]").append(tabContent.get(0).outerHTML);


    });
    //Draw tab content for each language
    $.each(app.build.create.initiate.languages, function (key, value) {
        app.build.create.dimension.validation.properties(value.code);
        $("#build-create-dimension-accordion-" + value.code).on('hide.bs.collapse show.bs.collapse', function (e) {
            $("#build-create-dimension-accordion-" + value.code).find("[type=submit]").trigger("click");
            if (!app.build.create.dimension.propertiesValid) { //keep open while invalid
                e.preventDefault();
            }
        });
        $("#build-create-dimension-accordion-" + value.code).find("[name=add-statistics]").once("click", function () {
            $("#build-create-statistic").find("[name=manual-submit-statistics]").attr("lng-iso-code", value.code);
            $("#build-create-statistic").find("[name=upload-submit-statistics]").attr("lng-iso-code", value.code);
            $('#build-create-manual-si table').find("tbody").empty();
            $('#build-create-manual-si').find("[name=manual-si-errors-card]").hide();
            $('#build-create-manual-si').find("[name=manual-si-errors]").empty();
            $('#build-create-manual-si table').editableTableWidget();
            $("#build-create-manual-si").find("[name=add-statistic-row]").once("click", function () {
                $('#build-create-manual-si table').find("tbody").append(
                    $("<tr>", {
                        "html": $("<th>", {
                            "idn": "row-number",
                            "class": "table-light"
                        }).get(0).outerHTML +
                            $("<td>", {
                                "idn": "code",
                                "label-lookup": "code"
                            }).get(0).outerHTML +
                            $("<td>", {
                                "idn": "value",
                                "label-lookup": "value"
                            }).get(0).outerHTML +
                            $("<td>", {
                                "idn": "unit",
                                "label-lookup": "unit"
                            }).get(0).outerHTML +
                            $("<td>", {
                                "idn": "decimal",
                                "label-lookup": "decimal",
                            }).get(0).outerHTML +
                            $("<th>", {
                                "html": app.library.html.deleteButton()
                            }).get(0).outerHTML
                    }).get(0).outerHTML
                );
                //redraw row numbers
                $('#build-create-manual-si table').find("tbody").find("tr").each(function (index, value) {
                    $(this).find("th").first().text(index + 1);
                });
                $('#build-create-manual-si table').find("button[name=" + C_APP_NAME_LINK_DELETE + "]").once('click', function () {
                    $(this).parent().parent().remove();
                    //redraw row numbers after delete
                    $('#build-create-manual-si table').find("tbody").find("tr").each(function (index, value) {
                        $(this).find("th").first().text(index + 1);
                    });
                    $('#build-create-manual-si').find("[name=manual-si-errors-card]").hide();
                    $('#build-create-manual-si').find("[name=manual-si-errors]").empty();
                });
                $('#build-create-manual-si table').editableTableWidget();
            });
            $("#build-create-manual-si").find("[name=add-statistic-row]").trigger("click");
            $("#build-create-statistic").modal("show");
        });
        $("#build-create-dimension-accordion-" + value.code).find("[name=search-classification]").once("click", function () {
            $("#build-create-search-classiication").find("[name=use-classification]").attr("lng-iso-code", value.code);
            $("#build-create-search-classiication").find("[name=search-classifications-modal-search-button]").attr("lng-iso-code", value.code);
            $("#build-create-search-classiication").find("[name=search-classification-language]").text(value.name);
            $("#build-create-search-classiication").modal("show");
        });
        $("#build-create-dimension-accordion-" + value.code).find("[name=add-classification]").once("click", function () {
            $("#build-create-manual-classification").find("[name=manual-submit-classifications]").attr("lng-iso-code", value.code);
            $("#build-create-upload-classification").find("[name=upload-submit-classifications]").attr("lng-iso-code", value.code);
            $('#build-create-manual-classification table').find("tbody").empty();
            $('#build-create-manual-classification').find("[name=manual-classification-errors]").empty();
            $('#build-create-manual-classification').find("[name=manual-classification-errors-card]").hide();
            $('#build-create-manual-classification table').editableTableWidget();
            $("#build-create-manual-classification").find("[name=add-classification-row]").once("click", function () {
                $('#build-create-manual-classification table').find("tbody").append(
                    $("<tr>", {
                        "html": $("<th>", {
                            "idn": "row-number",
                            "class": "table-light"
                        }).get(0).outerHTML +
                            $("<td>", {
                                "idn": "code",
                                "label-lookup": "code"
                            }).get(0).outerHTML +
                            $("<td>", {
                                "idn": "value",
                                "label-lookup": "value"
                            }).get(0).outerHTML +
                            $("<th>", {
                                "html": app.library.html.deleteButton()
                            }).get(0).outerHTML
                    }).get(0).outerHTML
                );
                //redraw row numbers
                $('#build-create-manual-classification table').find("tbody").find("tr").each(function (index, value) {
                    $(this).find("th").first().text(index + 1);
                });
                $('#build-create-manual-classification table').find("button[name=" + C_APP_NAME_LINK_DELETE + "]").once('click', function () {
                    $(this).parent().parent().remove();
                    //redraw row numbers after delete
                    $('#build-create-manual-classification table').find("tbody").find("tr").each(function (index, value) {
                        $(this).find("th").first().text(index + 1);
                    });
                    $('#build-create-manual-classification').find("[name=manual-classification-errors]").empty();
                    $('#build-create-manual-classification').find("[name=manual-classification-errors-card]").hide();
                });
                $('#build-create-manual-classification table').editableTableWidget();
            });
            $("#build-create-manual-classification").find("[name=add-classification-row]").trigger("click");
            $("#build-create-classification").modal("show");
            app.build.create.dimension.validation.manualClassification();
            app.build.create.dimension.validation.uploadClassification();
        });
        $("#build-create-dimension-accordion-" + value.code).find("[name=add-periods]").once("click", function () {
            $("#build-create-new-periods").find("[name=upload-submit-periods]").attr("lng-iso-code", value.code);
            $("#build-create-new-periods").find("[name=manual-submit-periods]").attr("lng-iso-code", value.code);

            $('#build-create-manual-periods table').find("tbody").empty();
            $('#build-create-manual-periods').find("[name=manual-periods-errors-card]").hide();
            $('#build-create-manual-periods').find("[name=manual-periods-errors]").empty();

            $('#build-create-manual-periods table').editableTableWidget();

            $("#build-create-manual-periods").find("[name=add-period-row]").once("click", function () {

                $('#build-create-manual-periods table').find("tbody").append(
                    $("<tr>", {
                        "html": $("<th>", {
                            "idn": "row-number",
                            "class": "table-light"
                        }).get(0).outerHTML +
                            $("<td>", {
                                "idn": "code",
                                "label-lookup": "code"
                            }).get(0).outerHTML +
                            $("<td>", {
                                "idn": "value",
                                "label-lookup": "value"
                            }).get(0).outerHTML +
                            $("<th>", {
                                "html": app.library.html.deleteButton()
                            }).get(0).outerHTML
                    }).get(0).outerHTML
                );

                //redraw row numbers
                $('#build-create-manual-periods table').find("tbody").find("tr").each(function (index, value) {
                    $(this).find("th").first().text(index + 1);
                });

                $('#build-create-manual-periods table').find("button[name=" + C_APP_NAME_LINK_DELETE + "]").once('click', function () {
                    $(this).parent().parent().remove();
                    //redraw row numbers after delete
                    $('#build-create-manual-periods table').find("tbody").find("tr").each(function (index, value) {
                        $(this).find("th").first().text(index + 1);
                    });
                    $('#build-create-manual-periods').find("[name=manual-si-errors-card]").hide();
                    $('#build-create-manual-periods').find("[name=manual-si-errors]").empty();
                });
                $('#build-create-manual-periods table').editableTableWidget();
            });
            $("#build-create-manual-periods").find("[name=add-period-row]").trigger("click");

            $("#build-create-new-periods").modal("show");
        });

        $("#build-create-dimension-accordion-" + value.code).find("[name=delete-all-statistics]").once("click", function () {
            api.modal.confirm(
                app.library.html.parseDynamicLabel("confirm-delete-statistics", [$(this).attr("lng-iso-name")]),
                app.build.create.dimension.deleteAllStatistics,
                $(this).attr("lng-iso-code")
            );
        });

        $("#build-create-dimension-accordion-" + value.code).find("[name=delete-all-classifications]").once("click", function () {
            api.modal.confirm(
                app.library.html.parseDynamicLabel("confirm-delete-classifications", [$(this).attr("lng-iso-name")]),
                app.build.create.dimension.deleteAllClassifications,
                $(this).attr("lng-iso-code")
            );
        });

        $("#build-create-dimension-accordion-" + value.code).find("[name=delete-all-periods]").once("click", function () {
            api.modal.confirm(
                app.library.html.parseDynamicLabel("confirm-delete-periods", [$(this).attr("lng-iso-name")]),
                app.build.create.dimension.callback.deleteAllPeriods,
                $(this).attr("lng-iso-code")
            );
        });



    });
};
//Clear the Dimension tabs.
app.build.create.dimension.clearTabs = function () {
    //clear the properties
    $.each(app.build.create.initiate.languages, function (key, value) {
        app.build.create.dimension.validation.properties(value.code);
        $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
            dimension.Statistic = [];
            dimension.Classification = [];
            dimension.Frequency.Period = [];
        });
        $("#build-create-dimensions").find("[name=dimension-error-card]").hide();
        app.build.create.dimension.drawStatistics(value.code);
        app.build.create.dimension.drawClassifications(value.code);
        app.build.create.dimension.drawPeriods(value.code);
        //set default language as active tab
        if (value.code == app.config.language.iso.code) {
            $("#build-create-dimension-nav-" + value.code + "-tab").addClass("active show");
        }
        else {
            $("#build-create-dimension-nav-" + value.code + "-tab").removeClass("active show");
        }
        //set properties accordion to be open
        $("#build-create-dimension-accordion-collapse-properties-" + value.code + "").addClass("show");
        $("#build-create-dimension-accordion-collapse-statistics-" + value.code + "").removeClass("show");
        $("#build-create-dimension-accordion-collapse-classifications-" + value.code + "").removeClass("show");
        $("#build-create-dimension-accordion-collapse-periods-" + value.code + "").removeClass("show");
    });
};

//#endregion
//#region statistics

/**
 * Draw Callback for Datatable
 *  @param {*} table
 *  @param {*} LngIsoCode
 */
app.build.create.dimension.drawCallbackDrawStatistics = function (table, LngIsoCode) {
    // Delete action
    $(table).find("[name=" + C_APP_NAME_LINK_DELETE + "]").once("click", function () {
        var params = {
            sttCode: $(this).attr("idn"),
            LngIsoCode: LngIsoCode
        };
        app.build.create.dimension.modal.deleteStatistic(params);
    });
}


/**
 *Draw table to hold the Statistics details passing in the chosen language.
 *
 * @param {*} LngIsoCode
 */
app.build.create.dimension.drawStatistics = function (LngIsoCode) {
    var data = null;
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the data based on the LngIsoCode
        if (dimension.LngIsoCode == LngIsoCode) {
            data = dimension.Statistic;
        }
    });
    var table = $("#build-create-dimension-accordion-" + LngIsoCode).find("[name=statistics-added-table]");
    if ($.fn.DataTable.isDataTable(table)) {
        app.library.datatable.reDraw(table, data);
    } else {
        var localOptions = {
            // Add Row Index to feed the ExtraInfo modal 
            createdRow: function (row, dataRow, dataIndex) {
                $(row).attr(C_APP_DATATABLE_ROW_INDEX, dataIndex);
            },
            data: data,
            ordering: false,
            columns: [
                {
                    data: "SttCode"
                },
                {
                    data: "SttValue"
                },
                {
                    data: "SttUnit"
                },
                {
                    data: "SttDecimal"
                },
                {
                    data: null,
                    sorting: false,
                    searchable: false,
                    render: function (data, type, row) {
                        return app.library.html.deleteButton({ idn: row.SttCode }, false);
                    },
                    "width": "1%"
                },
            ],
            drawCallback: function (settings) {
                app.build.create.dimension.drawCallbackDrawStatistics(table, LngIsoCode);
            },
            //Translate labels language
            language: app.label.plugin.datatable
        };
        $(table).DataTable($.extend(true, {}, app.config.plugin.datatable, localOptions)).on('responsive-display', function (e, datatable, row, showHide, update) {
            app.build.create.dimension.drawCallbackDrawStatistics(table, LngIsoCode);
        });
    }
};

/**
 *Confirm the Deletion of a Statistic based on the parameters passed in
 * and call the deleteStatistic function 
 * @param {*} params
 */
app.build.create.dimension.modal.deleteStatistic = function (params) {
    api.modal.confirm(
        app.library.html.parseDynamicLabel("confirm-delete", [params.sttCode]),
        app.build.create.dimension.deleteStatistic,
        params
    );
};

/**
 * Find the Statistic to Delete by the Language code and
 * redraw the table.
 *
 * @param {*} params
 */
app.build.create.dimension.deleteStatistic = function (params) {
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
        if (dimension.LngIsoCode == params.LngIsoCode) { //find the data based on the LngIsoCode
            data = dimension.Statistic;
            $(data).each(function (key, value) {
                if (value.SttCode == params.sttCode) { //find the record to delete
                    data.splice(key, 1);
                }
            });
        }
    });
    app.build.create.dimension.drawStatistics(params.LngIsoCode);
};

/**
 * Delete all statistics for a language
 * redraw the table.
 *
 * @param {*} lngIsoCode
 */
app.build.create.dimension.deleteAllStatistics = function (lngIsoCode) {
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
        if (dimension.LngIsoCode == lngIsoCode) { //find the data based on the LngIsoCode
            dimension.Statistic = [];
        };
    });
    app.build.create.dimension.drawStatistics(lngIsoCode);
};

/**
 * Call on click of the Add Statistics button to validate and add the statistics entered
 * based on the language selected.
 *
 * @param {*} LngIsoCode
 */
app.build.create.dimension.submitManualStatistic = function (LngIsoCode) {
    $('#build-create-manual-si').find("[name=manual-si-errors-card]").hide();
    $('#build-create-manual-si').find("[name=manual-si-errors]").empty();
    app.build.create.dimension.statisticsManualValid = true;
    app.build.create.dimension.validateManualStatistic();
    var codes = [];
    var values = [];
    $('#build-create-manual-si table').find("tbody tr").each(function (index) {
        var row = $(this);
        codes.push(row.find("td[idn=code]").text().trim().toLowerCase());
        values.push(row.find("td[idn=value]").text().trim().toLowerCase());
    });
    //Add previous codes to codes array
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the data based on the LngIsoCode
        if (dimension.LngIsoCode == LngIsoCode) {
            var statistics = dimension.Statistic;
            $(statistics).each(function (key, value) {
                codes.push(value.SttCode.trim().toLowerCase());
                values.push(value.SttValue.trim().toLowerCase());
            });
        }
    });
    //check for duplicate SI codes
    if (app.library.utility.arrayHasDuplicate(codes) || app.library.utility.arrayHasDuplicate(values)) {
        $('#build-create-manual-si').find("[name=manual-si-errors-card]").show();
        $('#build-create-manual-si').find("[name=manual-si-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["create-duplicate-statistic"]
        }));
        app.build.create.dimension.statisticsManualValid = false;
    }
    if (app.build.create.dimension.statisticsManualValid) {
        $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the statistic you need based on the LngIsoCode and insert new statistics
            if (dimension.LngIsoCode == LngIsoCode) {
                $.each($('#build-create-manual-si table').find("tbody tr"), function (index, value) {
                    dimension.Statistic.push({
                        "SttCode": $(this).find("td[idn=code]").text().trim(),
                        "SttValue": $(this).find("td[idn=value]").text().trim(),
                        "SttUnit": $(this).find("td[idn=unit]").text().trim(),
                        "SttDecimal": $(this).find("td[idn=decimal]").text().trim()
                    });
                });
            }
        });
        app.build.create.dimension.drawStatistics(LngIsoCode);
        $("#build-create-statistic").modal("hide");
    }
};

/**
 * Upload and validate a CSV file for statistics.
 *
 * @param {*} LngIsoCode
 */
app.build.create.dimension.submitUploadStatistic = function (LngIsoCode) {
    $('#build-create-upload-si').find("[name=upload-si-errors-card]").hide();
    $('#build-create-upload-si').find("[name=upload-si-errors]").empty();

    app.build.create.file.statistic.content.data.JSON = Papa.parse(app.build.create.file.statistic.content.UTF8, {
        header: true,
        skipEmptyLines: true
    });
    app.build.create.dimension.statisticsUploadValid = true;

    var csvHeaders = app.build.create.file.statistic.content.data.JSON.meta.fields;

    //check that csv has 2 headers
    if (csvHeaders.length != 4) {
        $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
        $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        app.build.create.dimension.statisticsUploadValid = false;
        return;
    };

    //check that csv headers only contain C_APP_CSV_CODE and C_APP_CSV_VALUE, both case sensitive

    if (jQuery.inArray(C_APP_CSV_CODE, csvHeaders) == -1 || jQuery.inArray(C_APP_CSV_VALUE, csvHeaders) == -1 || jQuery.inArray(C_APP_CSV_UNIT, csvHeaders) == -1 || jQuery.inArray(C_APP_CSV_DECIMAL, csvHeaders) == -1) {
        $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
        $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        app.build.create.dimension.statisticsUploadValid = false;
        return
    };

    //check that csv has data
    if (!app.build.create.file.statistic.content.data.JSON.data.length) {
        $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
        $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        app.build.create.dimension.statisticsUploadValid = false;
        return;
    };

    //check for duplicate codes
    var codes = [];
    var values = [];
    $(app.build.create.file.statistic.content.data.JSON.data).each(function (key, value) {
        codes.push(value[C_APP_CSV_CODE].toLowerCase());
        values.push(value[C_APP_CSV_VALUE].toLowerCase());
    });
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the data based on the LngIsoCode
        if (dimension.LngIsoCode == LngIsoCode) {
            var statistics = dimension.Statistic;
            $(statistics).each(function (key, statistic) {
                codes.push(statistic.SttCode.trim().toLowerCase());
                values.push(statistic.SttValue.trim().toLowerCase());
            });
        }
    });
    //Check for duplicates
    if (app.library.utility.arrayHasDuplicate(codes) || app.library.utility.arrayHasDuplicate(values)) {
        $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
        $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["create-duplicate-statistic"]
        }));
        app.build.create.dimension.statisticsUploadValid = false;
    }
    //Call to Validate uploaded statistics
    app.build.create.dimension.validateUploadStatistic(app.build.create.file.statistic.content.data.JSON.data);
    if (app.build.create.dimension.statisticsUploadValid) {
        $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the statistic you need based on the LngIsoCode and insert new statistics
            if (dimension.LngIsoCode == LngIsoCode) {
                $.each(app.build.create.file.statistic.content.data.JSON.data, function (index, value) {
                    dimension.Statistic.push({
                        "SttCode": value[C_APP_CSV_CODE].trim(),
                        "SttValue": value[C_APP_CSV_VALUE].trim(),
                        "SttUnit": value[C_APP_CSV_UNIT].trim(),
                        "SttDecimal": value[C_APP_CSV_DECIMAL].trim()
                    });
                });
            }
        });
        app.build.create.dimension.drawStatistics(LngIsoCode);
        $("#build-create-statistic").modal("hide");
    }
};

/**
 * Validate the Statistics uploaded by CSV file
 *
 *
 * @returns
 */
app.build.create.dimension.validateUploadStatistic = function () {
    if (app.build.create.file.statistic.content.data.JSON.data.length == 0) {
        app.build.create.dimension.statisticsUploadValid = false;
        $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
        $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        return;
    }

    $(app.build.create.file.statistic.content.data.JSON.data).each(function (key, value) {
        //validate code
        if (value[C_APP_CSV_CODE].trim().length == 0) {
            app.build.create.dimension.statisticsUploadValid = false;
            $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
            $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.library.html.parseDynamicLabel("code-mandatory", [key + 2])
            }));
        }
        if (value[C_APP_CSV_CODE].trim().length > 256) {
            app.build.create.dimension.statisticsUploadValid = false;
            $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
            $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.library.html.parseDynamicLabel("code-between", [key + 2])
            }));
        }
        //validate value
        if (value[C_APP_CSV_VALUE].trim().length == 0) {
            app.build.create.dimension.statisticsUploadValid = false;
            $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
            $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.library.html.parseDynamicLabel("value-mandatory", [key + 2])
            }));
        }
        if (value[C_APP_CSV_VALUE].trim().length > 256) {
            app.build.create.dimension.statisticsUploadValid = false;
            $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
            $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.library.html.parseDynamicLabel("value-between", [key + 2])
            }));
        }
        //validate unit
        if (value[C_APP_CSV_UNIT].trim().length == 0) {
            app.build.create.dimension.statisticsUploadValid = false;
            $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
            $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.library.html.parseDynamicLabel("unit-mandatory", [key + 2])
            }));
        }
        if (value[C_APP_CSV_UNIT].trim().length > 256) {
            app.build.create.dimension.statisticsUploadValid = false;
            $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
            $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.library.html.parseDynamicLabel("unit-between", [key + 2])
            }));
        }
        //validate decimal
        var decimal = Number(value[C_APP_CSV_DECIMAL].trim());
        if (!value[C_APP_CSV_DECIMAL].length) {
            app.build.create.dimension.statisticsUploadValid = false;
            $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
            $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.library.html.parseDynamicLabel("decimal-mandatory", [key + 2])
            }));
        }
        else if ($.isNumeric(decimal)) {
            if (Number.isInteger(decimal)) {
                if (decimal < 0 || decimal > 6) {
                    app.build.create.dimension.statisticsUploadValid = false;
                    $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
                    $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                        "class": "list-group-item",
                        "html": app.library.html.parseDynamicLabel("decimal-between", [key + 2])
                    }));
                }
            }
            else {
                app.build.create.dimension.statisticsUploadValid = false;
                $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
                $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                    "class": "list-group-item",
                    "html": app.library.html.parseDynamicLabel("decimal-integer", [key + 2])
                }));
            }
        }
        else {
            app.build.create.dimension.statisticsUploadValid = false;
            $('#build-create-upload-si').find("[name=upload-si-errors-card]").show();
            $('#build-create-upload-si').find("[name=upload-si-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.library.html.parseDynamicLabel("decimal-integer", [key + 2])
            }));
        }
    });
};
//Validate the statistic entered.
app.build.create.dimension.validateManualStatistic = function () {
    //check for empty cells
    $('#build-create-manual-si table').find("tbody tr").each(function (index) {
        var row = $(this);
        $(this).find("td").each(function () {
            var column = app.label.static[$(this).attr("label-lookup")];
            var value = $(this).text().trim();
            if (value.length == 0) {
                $('#build-create-manual-si').find("[name=manual-si-errors-card]").show();
                $('#build-create-manual-si').find("[name=manual-si-errors]").append($("<li>", {
                    "class": "list-group-item",
                    "html": app.library.html.parseDynamicLabel("create-mandatory", [row.find("th[idn=row-number]").text(), column])
                }));
                app.build.create.dimension.statisticsManualValid = false;
            }
            else {
                if ($(this).attr("idn") == "decimal") {
                    var decimal = Number(value);
                    if ($.isNumeric(decimal)) {
                        if (Number.isInteger(decimal)) {
                            if (decimal < 0 || decimal > 6) {
                                $('#build-create-manual-si').find("[name=manual-si-errors-card]").show();
                                $('#build-create-manual-si').find("[name=manual-si-errors]").append($("<li>", {
                                    "class": "list-group-item",
                                    "html": app.library.html.parseDynamicLabel("create-between", [row.find("th[idn=row-number]").text(), column])
                                }));
                                app.build.create.dimension.statisticsManualValid = false;
                            }
                        }
                        else {
                            $('#build-create-manual-si').find("[name=manual-si-errors-card]").show();
                            $('#build-create-manual-si').find("[name=manual-si-errors]").append($("<li>", {
                                "class": "list-group-item",
                                "html":
                                    app.library.html.parseDynamicLabel("create-integer", [row.find("th[idn=row-number]").text(), column])
                            }));
                            app.build.create.dimension.statisticsManualValid = false;
                        }
                    }
                    else {
                        $('#build-create-manual-si').find("[name=manual-si-errors-card]").show();
                        $('#build-create-manual-si').find("[name=manual-si-errors]").append($("<li>", {
                            "class": "list-group-item",
                            "html": app.library.html.parseDynamicLabel("create-integer", [row.find("th[idn=row-number]").text(), column])
                        }));
                        app.build.create.dimension.statisticsManualValid = false;
                    }
                }
                else { //not decimal column                    
                    if (value.trim().length > 256 && value.trim().length > 0) {
                        $('#build-create-manual-si').find("[name=manual-si-errors-card]").show();
                        $('#build-create-manual-si').find("[name=manual-si-errors]").append($("<li>", {
                            "class": "list-group-item",
                            "html": app.library.html.parseDynamicLabel("create-between-characters", [row.find("th[idn=row-number]").text(), column])
                        }));
                        app.build.create.dimension.statisticsManualValid = false;
                    }
                }
            }
        });
    });
};

//#endregion
//#region classifications 

/**
 * Draw Callback for Datatable
 *  @param {*} table
 *  @param {*} LngIsoCode
 */
app.build.create.dimension.drawCallbackDrawClassifications = function (table, LngIsoCode) {

    // Delete action
    $(table).find("[name=" + C_APP_NAME_LINK_DELETE + "]").once("click", function () {
        var params = {
            ClsCode: $(this).attr("idn"),
            LngIsoCode: LngIsoCode
        };
        app.build.create.dimension.modal.deleteClassification(params);
    });
    $(table).find("[name=" + C_APP_NAME_LINK_VIEW + "]").once("click", function (e) {
        e.preventDefault();
        app.build.create.dimension.modal.viewClassification($(this).attr("cls-code"), $(this).attr("lng-iso-code"));
    });

    $(table).find("[name=" + C_APP_NAME_LINK_GEOJSON + "]").once("click", function (e) {
        e.preventDefault();
        app.map.draw($(this).attr("geojson-url"), $(this).attr("cls-code"), $(this).attr("cls-value"));
    });
}


/**
 * Draw the Classification tabs for the selected language
 *
 * @param {*} LngIsoCode
 */
app.build.create.dimension.drawClassifications = function (LngIsoCode) {
    var data = [];
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the data based on the LngIsoCode
        if (dimension.LngIsoCode == LngIsoCode) {
            $.each(dimension.Classification, function (index, classification) { //find the data based on the LngIsoCode
                data.push({
                    "ClsCode": classification.ClsCode,
                    "ClsValue": classification.ClsValue,
                    "ClsGeoUrl": classification.ClsGeoUrl,
                    "VariableLength": classification.Variable.length
                });
            });
        }
    });
    //Create accordion for classification
    var table = $("#build-create-dimension-accordion-" + LngIsoCode).find("[name=classifications-added-table]");
    if ($.fn.DataTable.isDataTable(table)) {
        app.library.datatable.reDraw(table, data);
    } else {
        var localOptions = {
            // Add Row Index to feed the ExtraInfo modal 
            createdRow: function (row, dataRow, dataIndex) {
                $(row).attr(C_APP_DATATABLE_ROW_INDEX, dataIndex);
            },
            data: data,
            ordering: false,
            columns: [
                {
                    data: null,
                    render: function (data, type, row) {
                        return app.library.html.link.view({ "cls-code": row.ClsCode, "lng-iso-code": LngIsoCode }, row.ClsCode);
                    }
                },
                {
                    data: "ClsValue"
                },
                {
                    data: null,
                    render: function (data, type, row) {
                        if (row.ClsGeoUrl && app.config.plugin.highcharts.enabled) {
                            return app.library.html.link.geoJson({ "geojson-url": row.ClsGeoUrl, "cls-value": row.ClsValue, "cls-code": row.ClsCode }, row.ClsGeoUrl);
                        }
                        else if (row.ClsGeoUrl) {
                            return app.library.html.link.external({}, row.ClsGeoUrl);
                        }
                        else {
                            return null
                        }


                    }
                },
                {
                    data: "VariableLength"
                },
                {
                    data: null,
                    sorting: false,
                    searchable: false,
                    render: function (data, type, row) {
                        return app.library.html.deleteButton({ idn: row.ClsCode }, false);
                    },
                    "width": "1%"
                },
            ],
            drawCallback: function (settings) {
                app.build.create.dimension.drawCallbackDrawClassifications(table, LngIsoCode);
            },
            //Translate labels language
            language: app.label.plugin.datatable
        };
        $(table).DataTable($.extend(true, {}, app.config.plugin.datatable, localOptions)).on('responsive-display', function (e, datatable, row, showHide, update) {
            app.build.create.dimension.drawCallbackDrawClassifications(table, LngIsoCode);
        });
    }
};

/**
 * Confirm deletion of classification for parameters entered.
 *
 * @param {*} params
 */
app.build.create.dimension.modal.deleteClassification = function (params) {
    api.modal.confirm(
        app.library.html.parseDynamicLabel("confirm-delete", [params.ClsCode]),
        app.build.create.dimension.deleteClassification,
        params
    );
};

/**
 *Find a classifications based on code and language entered.
 *
 * @param {*} clsCode
 * @param {*} lngIsoCode
 */
app.build.create.dimension.modal.viewClassification = function (clsCode, lngIsoCode) {
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
        if (dimension.LngIsoCode == lngIsoCode) { //find the data based on the LngIsoCode
            data = dimension.Classification;
            $(data).each(function (key, value) {
                if (value.ClsCode == clsCode) {
                    app.build.create.dimension.callback.viewClassification(value);
                }
            });
        }
    });
};

/**
 * Draw table to display details of classifications searched for
 *
 * @param {*} data
 */
app.build.create.dimension.callback.viewClassification = function (data) {
    $("#build-create-view-classification").find("[name=title]").text(data.ClsCode + ": " + data.ClsValue);
    if ($.fn.dataTable.isDataTable("#build-create-view-classification table")) {
        app.library.datatable.reDraw("#build-create-view-classification table", data.Variable);
    } else {
        var localOptions = {
            data: data.Variable,
            ordering: false,
            columns: [
                { data: "VrbCode" },
                { data: "VrbValue" },
            ],
            //Translate labels language
            language: app.label.plugin.datatable
        };
        //Initialize DataTable
        $("#build-create-view-classification table").DataTable($.extend(true, {}, app.config.plugin.datatable, localOptions));
    }
    $("#build-create-view-classification").modal("show");
};


/**
 * Delete a classification for a selected language and redraw the table.
 *
 * @param {*} params
 */
app.build.create.dimension.deleteClassification = function (params) {
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
        if (dimension.LngIsoCode == params.LngIsoCode) { //find the data based on the LngIsoCode
            data = dimension.Classification;
            $(data).each(function (key, value) {
                if (value.ClsCode == params.ClsCode) { //find the record to delete
                    data.splice(key, 1);
                }
            });
        }
    });
    app.build.create.dimension.drawClassifications(params.LngIsoCode);
};

/**
 * Delete all classifications for a selected language and redraw the table.
 *
 * @param {*} lngIsoCode
 */
app.build.create.dimension.deleteAllClassifications = function (lngIsoCode) {
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
        if (dimension.LngIsoCode == lngIsoCode) { //find the data based on the LngIsoCode
            dimension.Classification = [];
        }
    });
    app.build.create.dimension.drawClassifications(lngIsoCode);
};

//Add criteria to search for a classification.
app.build.create.dimension.searchClassifications = function () {
    // Click event search-classifications-modal-search-input
    $("#build-create-search-classiication").find("[name=classifications-search-input]").on('keyup', function (e) {
        e.preventDefault();
        if (e.keyCode == 13) {
            var lngIsoCode = $("#build-create-search-classiication").find("[name=search-classifications-modal-search-button]").attr("lng-iso-code");
            app.build.create.dimension.ajax.searchClassifications(lngIsoCode);
        }
    });
    // Click eventsearch-classifications-modal-search-button
    $("#build-create-search-classiication").find("[name=search-classifications-modal-search-button]").on('click', function (e) {
        e.preventDefault();
        var lngIsoCode = $(this).attr("lng-iso-code");
        app.build.create.dimension.ajax.searchClassifications(lngIsoCode);
    });
};

/**
 * Search for a classification with search criteria and language code.
 *
 * @param {*} search
 * @param {*} lngIsoCode
 */
app.build.create.dimension.ajax.searchClassifications = function (lngIsoCode) {
    api.ajax.jsonrpc.request(
        app.config.url.api.private,
        "PxStat.Data.Classification_API.Search",
        {
            "Search": $("#build-create-search-classiication").find("[name=classifications-search-input]").val().trim(),
            "LngIsoCode": lngIsoCode
        },
        "app.build.create.dimension.callback.searchClassifications",
        null,
        null,
        null,
        { async: false });
};

/**
 * Get classification details returned from Search.
 *
 * @param {*} response
 */
app.build.create.dimension.callback.searchClassifications = function (response) {
    if (response.error) {
        api.modal.error(response.error.message);
    } else if (response.data !== undefined) {
        app.build.create.dimension.callback.drawSearchClassifications(response.data);
    } else api.modal.exception(app.label.static["api-ajax-exception"]);
};

/**
 * Draw Callback for Datatable
 *  @param {*} data
 */
app.build.create.dimension.drawCallbackSearchClassification = function (data) {
    $('[data-toggle="tooltip"]').tooltip();
    $("#build-create-search-classiication table[name=search-classifications-list-table] [name=" + C_APP_NAME_LINK_VIEW + "]").once("click", function (e) {
        e.preventDefault();
        app.build.create.dimension.ajax.readClassification($(this).attr("cls-id"));

    });

    $("#build-create-search-classiication table[name=search-classifications-list-table] [name=" + C_APP_NAME_LINK_GEOJSON + "]").once("click", function (e) {
        e.preventDefault();
        app.map.draw($(this).attr("geojson-url"), $(this).attr("cls-code"), $(this).attr("cls-value"));
    });
    // Responsive
    $("#search-classifications-modal table[name=search-classifications-list-table]").DataTable().columns.adjust().responsive.recalc();
}

/**
 * Draw the Classification table adding the details returned from the search.
 *
 * @param {*} searchResults
 */
app.build.create.dimension.callback.drawSearchClassifications = function (searchResults) {
    //hide any previous classification variable table
    $("#build-create-search-classiication").find("[name=read-classification-table-container]").hide();

    if ($.fn.dataTable.isDataTable("#build-create-search-classiication table[name=search-classifications-list-table]")) {
        app.library.datatable.reDraw("#build-create-search-classiication table[name=search-classifications-list-table]", searchResults);
    } else {
        var localOptions = {
            data: searchResults,
            columns: [
                { data: "MtrCode" },
                {
                    data: null,
                    render: function (data, type, row) {
                        return app.library.html.link.view({ "cls-code": row.ClsCode, "cls-id": row.ClsID }, row.ClsCode);
                    }
                },
                { data: "ClsValue" },
                {
                    data: null,
                    render: function (data, type, row) {
                        if (row.ClsGeoUrl && app.config.plugin.highcharts.enabled) {
                            return app.library.html.link.geoJson({ "geojson-url": row.ClsGeoUrl, "cls-value": row.ClsValue, "cls-code": row.ClsCode }, row.ClsGeoUrl);
                        }
                        else if (row.ClsGeoUrl) {
                            return app.library.html.link.external({}, row.ClsGeoUrl);
                        }
                        else {
                            return null
                        }

                    }
                },
                { data: "VrbCount" }
            ],
            drawCallback: function (settings) {
                app.build.create.dimension.drawCallbackSearchClassification(searchResults);
            },
            //Translate labels language
            language: app.label.plugin.datatable
        };
        //Initialize DataTable
        $("#build-create-search-classiication table[name=search-classifications-list-table]").DataTable($.extend(true, {}, app.config.plugin.datatable, localOptions)).on('responsive-display', function (e, datatable, row, showHide, update) {
            app.build.create.dimension.drawCallbackSearchClassification(searchResults);
        });
    }
    $("#build-create-search-classiication").find("[name=search-classifications-list-table-container]").hide().fadeIn();
};

/**
 * Read Classification from the database
 *
 * @param {*} apiParams
 * @param {*} callbackParams
 */
app.build.create.dimension.ajax.readClassification = function (classificationId) {
    api.ajax.jsonrpc.request(
        app.config.url.api.private,
        "PxStat.Data.Classification_API.Read",
        {
            "ClsID": classificationId,
        },
        "app.build.create.dimension.callback.readClassification",
        null,
        null,
        null,
        { async: false });
};

//Create a classification
app.build.create.dimension.callback.buildManualClassification = function () {

    $("#build-create-manual-classification").find("[name=manual-classification-errors]").empty();
    var lngIsoCode = $("#build-create-manual-classification").find("[name=manual-submit-classifications]").attr("lng-iso-code");
    var classification = {
        "ClsCode": null,
        "ClsValue": null,
        "ClsGeoUrl": null,
        "Variable": []
    };
    //check if classification code already added
    var codes = [];
    var values = [];
    //add this classification code to array
    codes.push($("#build-create-manual-classification").find("[name=cls-code]").val().toLowerCase());
    values.push($("#build-create-manual-classification").find("[name=cls-value]").val().toLowerCase());
    //Add previous codes to codes array
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the data based on the LngIsoCode
        if (dimension.LngIsoCode == lngIsoCode) {
            var classifications = dimension.Classification;
            $(classifications).each(function (key, value) {
                codes.push(value.ClsCode.trim().toLowerCase());
                values.push(value.ClsValue.trim().toLowerCase());
            });
        }
    });
    //Check for duplicate codes
    if (!app.library.utility.arrayHasDuplicate(codes) && !app.library.utility.arrayHasDuplicate(values)) {//no duplicates classification codes or values
        var variableCodes = [];
        var variableValues = [];

        $('#build-create-manual-classification table').find("tbody tr").each(function (index) {
            //populate codes array to check for duplicates
            variableCodes.push($(this).find("td[idn=code]").text().trim().toLowerCase());
            variableValues.push($(this).find("td[idn=value]").text().trim().toLowerCase());
        });
        //Check for duplicate variable codes
        if (!app.library.utility.arrayHasDuplicate(variableCodes) && !app.library.utility.arrayHasDuplicate(variableValues)) { //no duplicates variables 
            var classificationValid = true;
            classification.ClsCode = $("#build-create-manual-classification").find("[name=cls-code]").val().trim();
            classification.ClsValue = $("#build-create-manual-classification").find("[name=cls-value]").val().trim();
            if ($("#build-create-manual-classification").find("[name=cls-geo-url]").val()) {
                classification.ClsGeoUrl = $("#build-create-manual-classification").find("[name=cls-geo-url]").val();
            }
            //create a row on the classification table
            $('#build-create-manual-classification table').find("tbody tr").each(function (key, value) {
                var row = $(this);
                //validate variables
                var variableCode = $(this).find("td[idn=code]").text().trim();
                var variableValue = $(this).find("td[idn=value]").text().trim();
                if (variableCode.length < 256 && variableCode.length > 0 && variableValue.length < 256 && variableValue.length > 0) { //validate variable
                    //populate codes array to check for duplicates
                    classification.Variable.push({
                        "VrbCode": variableCode,
                        "VrbValue": variableValue
                    });
                }
                else {
                    $('#build-create-manual-classification').find("[name=manual-classification-errors-card]").show();
                    $('#build-create-manual-classification').find("[name=manual-classification-errors]").append($("<li>", {
                        "class": "list-group-item",
                        "html": app.library.html.parseDynamicLabel("create-code-values", [row.find("th[idn=row-number]").text()])
                    }));
                    classificationValid = false;
                }
            });
            if (classification.Variable.length == 0) {
                classificationValid = false;
                $('#build-create-manual-classification').find("[name=manual-classification-errors-card]").show();
                $('#build-create-manual-classification').find("[name=manual-classification-errors]").append($("<li>", {
                    "class": "list-group-item",
                    "html": app.label.static["create-variable"]
                }));
            }
            if (classificationValid) { //everything valid, add classification and redraw table
                $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the statistic you need based on the LngIsoCode and insert new statistics
                    if (dimension.LngIsoCode == lngIsoCode) {
                        dimension.Classification.push(classification);
                    }
                });
                $("#build-create-manual-classification").find("[name=manual-classification-errors]").empty();
                app.build.create.dimension.drawClassifications(lngIsoCode);
                $("#build-create-classification").modal("hide");
            }
        }
        else {
            $('#build-create-manual-classification').find("[name=manual-classification-errors-card]").show();
            $('#build-create-manual-classification').find("[name=manual-classification-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.label.static["create-duplicate-variable"]
            }));
        }
    }
    else {
        $('#build-create-manual-classification').find("[name=manual-classification-errors-card]").show();
        $('#build-create-manual-classification').find("[name=manual-classification-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["create-duplicate-classification"]
        }));
    }
};

/**
 * Get callback from server and Create classifications from uploaded CSV file'
 *
 * @returns
 */
app.build.create.dimension.callback.buildUploadClassification = function () {
    $("#build-create-upload-classification").find("[name=upload-classification-errors]").empty();
    $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").hide();
    var lngIsoCode = $("#build-create-upload-classification").find("[name=upload-submit-classifications]").attr("lng-iso-code");
    var classification = {
        "ClsCode": null,
        "ClsValue": null,
        "ClsGeoUrl": null,
        "Variable": []
    };
    app.build.create.file.classification.content.data.JSON = Papa.parse(app.build.create.file.classification.content.UTF8, {
        header: true,
        skipEmptyLines: true
    });

    var csvHeaders = app.build.create.file.classification.content.data.JSON.meta.fields;

    //check that csv has 2 headers
    if (csvHeaders.length != 2) {
        classificationValid = false;
        $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").show();
        $('#build-create-upload-classification').find("[name=upload-classification-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        return;
    };

    //check that csv headers only contain C_APP_CSV_CODE and C_APP_CSV_VALUE, both case sensitive

    if (jQuery.inArray(C_APP_CSV_CODE, csvHeaders) == -1 || jQuery.inArray(C_APP_CSV_VALUE, csvHeaders) == -1) {
        classificationValid = false;
        $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").show();
        $('#build-create-upload-classification').find("[name=upload-classification-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        return;
    };


    //check that csv has data
    if (!app.build.create.file.classification.content.data.JSON.data.length) {
        classificationValid = false;
        $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").show();
        $('#build-create-upload-classification').find("[name=upload-classification-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        return;
    };

    var codes = [];
    var values = [];
    //add this classification code to array
    codes.push($("#build-create-upload-classification").find("[name=cls-code]").val().toLowerCase());
    values.push($("#build-create-upload-classification").find("[name=cls-value]").val().toLowerCase());
    //Add previous codes to codes array
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the data based on the LngIsoCode
        if (dimension.LngIsoCode == lngIsoCode) {
            var classifications = dimension.Classification;
            $(classifications).each(function (key, value) {
                codes.push(value.ClsCode.trim().toLowerCase());
                values.push(value.ClsValue.trim().toLowerCase());
            });
        }
    });
    //Check for duplicate codes
    if (!app.library.utility.arrayHasDuplicate(codes) && !app.library.utility.arrayHasDuplicate(values)) {//no duplicates classification
        var variableCodes = [];
        var variableValues = [];
        $(app.build.create.file.classification.content.data.JSON.data).each(function (key, value) {
            variableCodes.push(value[C_APP_CSV_CODE].trim().toLowerCase());
            variableValues.push(value[C_APP_CSV_VALUE].trim().toLowerCase());
        });
        //Check for duplicate variable codes
        if (!app.library.utility.arrayHasDuplicate(variableCodes) && !app.library.utility.arrayHasDuplicate(variableValues)) { //no duplicates variables
            var classificationValid = true;
            classification.ClsCode = $("#build-create-upload-classification").find("[name=cls-code]").val().trim();
            classification.ClsValue = $("#build-create-upload-classification").find("[name=cls-value]").val().trim();
            if ($("#build-create-upload-classification").find("[name=cls-geo-url]").val()) {
                classification.ClsGeoUrl = $("#build-create-upload-classification").find("[name=cls-geo-url]").val();
            }

            // if (codePosition == -1 || valuePosition == -1) {
            if (app.build.create.file.classification.content.data.JSON.meta.fields.length > 2) {
                classificationValid = false;
                $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").show();
                $('#build-create-upload-classification').find("[name=upload-classification-errors]").append($("<li>", {
                    "class": "list-group-item",
                    "html": app.label.static["invalid-csv-format"]
                }));
                return;
            }
            $(app.build.create.file.classification.content.data.JSON.data).each(function (key, value) {
                var variableCode = value[C_APP_CSV_CODE].trim();
                var variableValue = value[C_APP_CSV_VALUE].trim();
                if (variableCode.length < 256 && variableCode.length > 0 && variableValue.length < 256 && variableValue.length > 0) { //validate variable
                    //populate codes array to check for duplicates
                    classification.Variable.push({
                        "VrbCode": variableCode,
                        "VrbValue": variableValue
                    });
                }
                else {
                    $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").show();
                    $('#build-create-upload-classification').find("[name=upload-classification-errors]").append($("<li>", {
                        "class": "list-group-item",
                        "html": app.library.html.parseDynamicLabel("create-variable", [key + 2])
                    }));
                    classificationValid = false;
                }
            });
            if (classification.Variable.length == 0) {
                classificationValid = false;
                $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").show();
                $('#build-create-upload-classification').find("[name=upload-classification-errors]").append($("<li>", {
                    "class": "list-group-item",
                    "html": app.label.static["create-variable"]
                }));
            }
            if (classificationValid) { //everything valid, add classification and redraw table
                $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the statistic you need based on the LngIsoCode and insert new statistics
                    if (dimension.LngIsoCode == lngIsoCode) {
                        dimension.Classification.push(classification);
                    }
                });
                $("#build-create-upload-classification").find("[name=upload-classification-errors]").empty();
                $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").hide();
                app.build.create.dimension.drawClassifications(lngIsoCode);
                $("#build-create-classification").modal("hide");
            }
        }
        else {
            $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").show();
            $('#build-create-upload-classification').find("[name=upload-classification-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.label.static["create-duplicate-variable"]
            }));
        }
    }
    else {
        $("#build-create-upload-classification").find("[name=upload-classification-errors-card]").show();
        $('#build-create-upload-classification').find("[name=upload-classification-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["create-duplicate-classification"]
        }));
    }
};


/**
 * Callback from server after reading data : app.build.create.dimension.callback.readClassification
 * @param  {} response
 */
app.build.create.dimension.callback.readClassification = function (response) {
    if (response.error) {
        api.modal.error(response.error.message);
    } else if (response.data !== undefined) {
        app.build.create.dimension.callback.drawClassification(response.data);
    } else api.modal.exception(app.label.static["api-ajax-exception"]);

};


/**
 * Draw Callback for Datatable
 */
app.build.create.dimension.drawCallbackDrawClassification = function () {
    // Responsive
    $("#build-create-search-classiication table[name=read-classification-table]").DataTable().columns.adjust().responsive.recalc();
}


/**
 * Draw table to display classifications.
 *
 * @param {*} data
 * @param {*} callbackParams
 */
app.build.create.dimension.callback.drawClassification = function (classification) {
    $("#build-create-search-classiication").find("[name=read-classification-table-label]").text(classification[0].ClsCode + ": " + classification[0].ClsValue);
    $("#build-create-search-classiication").find("[name=read-classification-table-container]").show();
    if ($.fn.dataTable.isDataTable("#build-create-search-classiication table[name=read-classification-table]")) {
        app.library.datatable.reDraw("#build-create-search-classiication table[name=read-classification-table]", classification);
    } else {
        var localOptions = {
            data: classification,
            columns: [
                { data: "VrbCode" },
                { data: "VrbValue" },
            ],
            drawCallback: function (settings) {
                // Responsive             
                app.build.create.dimension.drawCallbackDrawClassification();
            },
            //Translate labels language
            language: app.label.plugin.datatable
        };
        //Initialize DataTable
        $("#build-create-search-classiication table[name=read-classification-table]").DataTable($.extend(true, {}, app.config.plugin.datatable, localOptions)).on('responsive-display', function (e, datatable, row, showHide, update) {
            // Responsive             
            app.build.create.dimension.drawCallbackDrawClassification();
        });
        window.onresize = function () {
            // Responsive
            $($.fn.dataTable.tables(true)).DataTable().columns.adjust().responsive.recalc();
        };
    }
    // Responsive
    $("#build-create-search-classiication table[name=read-classification-table]").DataTable().columns.adjust().responsive.recalc();
    $("#build-create-search-classiication").find("[name=read-classification-table-container]").hide().fadeIn();
    $("#build-create-search-classiication").find("[name=use-classification]").once("click", function () {
        var LngIsoCode = $(this).attr("lng-iso-code");
        app.build.create.dimension.callback.useClassification(classification, LngIsoCode);
    });
    $("#build-create-search-classiication").find("[name=download-classification]").once("click", function () {
        app.build.create.dimension.callback.downloadClassification(classification);
    });

};

/**
 *Callback to add classifications to table
 *
 * @param {*} variables
 * @param {*} LngIsoCode
 */
app.build.create.dimension.callback.useClassification = function (variables, LngIsoCode) {
    var classification = {
        "ClsCode": null,
        "ClsValue": null,
        "ClsGeoUrl": null,
        "Variable": []
    };
    //check if classification already added
    var codes = [];
    var values = [];
    //add this classification code to array
    codes.push(variables[0].ClsCode.toLowerCase());
    values.push(variables[0].ClsValue.toLowerCase());
    //Add previous codes to codes array
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the data based on the LngIsoCode
        if (dimension.LngIsoCode == LngIsoCode) {
            var classifications = dimension.Classification;
            $(classifications).each(function (key, value) {
                codes.push(value.ClsCode.trim().toLowerCase());
                values.push(value.ClsValue.trim().toLowerCase());
            });
        }
    });
    //Check for duplicate codes
    if (!app.library.utility.arrayHasDuplicate(codes) && !app.library.utility.arrayHasDuplicate(values)) { //classification not already added
        classification.ClsCode = variables[0].ClsCode;
        classification.ClsValue = variables[0].ClsValue;
        classification.ClsGeoUrl = variables[0].ClsGeoUrl;
        $.each(variables, function (key, value) {
            classification.Variable.push({
                "VrbCode": value.VrbCode,
                "VrbValue": value.VrbValue
            });
        });
        //insert classification into API object
        //Add previous codes to codes array
        $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
            if (dimension.LngIsoCode == LngIsoCode) {
                var classifications = dimension.Classification;
                classifications.push(classification);
            }
            // Display Success Modal
            api.modal.success(app.library.html.parseDynamicLabel("success-record-added", [variables[0].ClsCode]));
        });
    }
    else {
        api.modal.error("Duplicate classification");
    }
    app.build.create.dimension.drawClassifications(LngIsoCode);
};

/**
 * Download classifications in CSV format
 *
 * @param {*} data
 * @param {*} callbackParams
 */
app.build.create.dimension.callback.downloadClassification = function (variables) {
    var fileData = [];
    $.each(variables, function (i, row) {
        fileData.push({ [C_APP_CSV_CODE]: row.VrbCode, C_APP_CSV_VALUE: row.VrbValue });
    });
    var mimeType = "text/plain";
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(Papa.unparse(fileData)));
    pom.setAttribute('download', variables[0].ClsCode + ".csv");
    if (document.createEvent) {
        // https://developer.mozilla.org/en-US/docs/Web/API/Document/createEvent
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
};
//#endregion
//#region periods

app.build.create.dimension.addPeriodsManual = function () {
    var lngIsoCode = $("#build-create-new-periods [name=manual-submit-periods]").attr("lng-iso-code");
    $('#build-create-manual-periods').find("[name=manual-periods-errors-card]").hide();
    $('#build-create-manual-periods').find("[name=manual-periods-errors]").empty();
    app.build.create.dimension.periodsManualValid = true;
    app.build.create.dimension.validateManualPeriod();

    //valid inputs, continue
    if (app.build.create.dimension.periodsManualValid) {
        var codes = [];
        var values = [];

        //add previous periods to array

        $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
            if (dimension.LngIsoCode == lngIsoCode) {
                $.each($(dimension.Frequency.Period), function (index, period) {
                    codes.push(period.PrdCode);
                    values.push(period.PrdValue);
                });
            }
        });

        //add new periods to array
        $('#build-create-manual-periods table').find("tbody tr").each(function (index) {
            var row = $(this);
            codes.push(row.find("td[idn=code]").text().trim().toLowerCase());
            values.push(row.find("td[idn=value]").text().trim().toLowerCase());
        });

        //check for duplicate periods
        if (app.library.utility.arrayHasDuplicate(codes) || app.library.utility.arrayHasDuplicate(values)) {
            $('#build-create-manual-periods').find("[name=manual-periods-errors-card]").show();
            $('#build-create-manual-periods').find("[name=manual-periods-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.label.static["build-duplicate-period"]
            }));
            app.build.create.dimension.periodsManualValid = false;
        }
    }

    //no duplicates, continue
    if (app.build.create.dimension.periodsManualValid) {
        $.each(app.build.create.initiate.data.Dimension, function (index, dimension) { //find the period you need based on the LngIsoCode and insert new statistics
            if (dimension.LngIsoCode == $("#build-create-new-periods [name=manual-submit-periods]").attr("lng-iso-code")) {
                $.each($('#build-create-manual-periods table').find("tbody tr"), function (index, value) {
                    dimension.Frequency.Period.push(
                        {
                            "PrdCode": $(this).find("td[idn=code]").text().trim(),
                            "PrdValue": $(this).find("td[idn=value]").text().trim()
                        }
                    );
                });
            }
        });
        app.build.create.dimension.drawPeriods($("#build-create-new-periods [name=manual-submit-periods]").attr("lng-iso-code"));
        $("#build-create-new-periods").modal("hide");
    }

};

app.build.create.dimension.addPeriodsUpload = function () {
    $('#build-create-upload-periods').find("[name=upload-periods-errors-card]").hide();
    $('#build-create-upload-periods').find("[name=upload-periods-errors]").empty();

    var lngIsoCode = $("#build-create-new-periods [name=upload-submit-periods]").attr("lng-iso-code");
    app.build.create.file.period.content.data.JSON = Papa.parse(app.build.create.file.period.content.UTF8, {
        header: true,
        skipEmptyLines: true
    });

    var csvHeaders = app.build.create.file.period.content.data.JSON.meta.fields;
    var periodsValid = true;
    //check that csv has 2 headers
    if (csvHeaders.length != 2) {
        periodsValid = false;
        $("#build-create-upload-periods").find("[name=upload-periods-errors-card]").show();
        $('#build-create-upload-periods').find("[name=upload-periods-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        return;
    };

    //check that csv headers only contain C_APP_CSV_CODE and C_APP_CSV_VALUE, both case sensitive

    if (jQuery.inArray(C_APP_CSV_CODE, csvHeaders) == -1 || jQuery.inArray(C_APP_CSV_VALUE, csvHeaders) == -1) {
        periodsValid = false;
        $("#build-create-upload-periods").find("[name=upload-periods-errors-card]").show();
        $('#build-create-upload-periods').find("[name=upload-periods-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        return;
    };


    if (!app.build.create.file.period.content.data.JSON.data.length) {
        periodsValid = false;
        $("#build-create-upload-periods").find("[name=upload-periods-errors-card]").show();
        $('#build-create-upload-periods').find("[name=upload-periods-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["invalid-csv-format"]
        }));
        return;
    }

    var variableCodes = [];
    var variableValues = [];
    $(app.build.create.file.period.content.data.JSON.data).each(function (key, value) {
        variableCodes.push(value[C_APP_CSV_CODE].trim().toLowerCase());
        variableValues.push(value[C_APP_CSV_VALUE].trim().toLowerCase());
    });

    //add previous added codes and values to array from either new periods or original periods

    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
        if (dimension.LngIsoCode == lngIsoCode) {
            $.each(dimension.Frequency.Period, function (index, variable) {
                variableCodes.push(variable.PrdCode);
                variableValues.push(variable.PrdValue);
            });
        }
    });

    //Check for duplicate variable codes
    if (!app.library.utility.arrayHasDuplicate(variableCodes) && !app.library.utility.arrayHasDuplicate(variableValues)) { //no duplicates variables      

        if (app.build.create.file.period.content.data.JSON.meta.fields.length > 2) {
            periodsValid = false;
            $("#build-create-upload-periods").find("[name=upload-periods-errors-card]").show();
            $('#build-create-upload-periods').find("[name=upload-periods-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.label.static["invalid-csv-format"]
            }));
            return;
        }

        $(app.build.create.file.period.content.data.JSON.data).each(function (key, value) {
            var variableCode = value[C_APP_CSV_CODE].trim();
            var variableValue = value[C_APP_CSV_VALUE].trim();


            if (variableCode.length > 256 && variableCode.length < 0 && variableValue.length > 256 && variableValue.length < 0) { //validate variable             
                periodsValid = false;
                $("#build-create-upload-periods").find("[name=upload-periods-errors-card]").show();
                $('#build-create-upload-periods').find("[name=upload-periods-errors]").append($("<li>", {
                    "class": "list-group-item",
                    "html": app.library.html.parseDynamicLabel("create-invalid-variable", [key + 2])
                }));
                return;
            }
        });

        if (app.build.create.file.period.content.data.JSON.data.length == 0) {
            periodsValid = false;
            $("#build-create-upload-periods").find("[name=upload-periods-errors-card]").show();
            $('#build-create-upload-periods').find("[name=upload-periods-errors]").append($("<li>", {
                "class": "list-group-item",
                "html": app.label.static["create-add-one-time-point"]
            }));
        }
        if (periodsValid) { //everything valid, add periods and redraw table
            $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
                if (dimension.LngIsoCode == lngIsoCode) {
                    $.each(app.build.create.file.period.content.data.JSON.data, function (index, variable) {
                        dimension.Frequency.Period.push({
                            PrdCode: variable[C_APP_CSV_CODE],
                            PrdValue: variable[C_APP_CSV_VALUE]
                        });
                    });
                }
            });
            $("#build-create-upload-periods").find("[name=upload-periods-errors]").empty();
            $("#build-create-upload-periods").find("[name=upload-periods-errors-card]").hide();
            app.build.create.dimension.drawPeriods(lngIsoCode);
            $("#build-create-new-periods").modal("hide");
        }
    }
    else {
        $("#build-create-upload-periods").find("[name=upload-periods-errors-card]").show();
        $('#build-create-upload-periods').find("[name=upload-periods-errors]").append($("<li>", {
            "class": "list-group-item",
            "html": app.label.static["build-duplicate-period"]
        }));
    }
};

//Validate the statistic entered.
app.build.create.dimension.validateManualPeriod = function () {
    //check for empty cells
    $('#build-create-manual-periods table').find("tbody tr").each(function (index) {
        var row = $(this);
        $(this).find("td").each(function () {

            var column = app.label.static[$(this).attr("label-lookup")];

            var value = $(this).text().trim();

            if (value.length == 0) {
                $('#build-create-manual-periods').find("[name=manual-periods-errors-card]").show();
                $('#build-create-manual-periods').find("[name=manual-periods-errors]").append($("<li>", {
                    "class": "list-group-item",
                    "html": app.library.html.parseDynamicLabel("create-mandatory", [row.find("th[idn=row-number]").text(), column])
                }));
                app.build.create.dimension.periodsManualValid = false;
            }
            else {
                if (value.trim().length > 256 && value.trim().length > 0) {
                    $('#build-create-manual-periods').find("[name=manual-periods-errors-card]").show();
                    $('#build-create-manual-periods').find("[name=manual-periods-errors]").append($("<li>", {
                        "class": "list-group-item",
                        "html": app.library.html.parseDynamicLabel("create-between-characters", [row.find("th[idn=row-number]").text(), column])
                    }));
                    app.build.create.dimension.periodsManualValid = false;
                }
            }
        });

    });
};

/**
 * Draw Callback for Datatable
 * @param {*} table
 * @param {*} lngIsoCode
 */
app.build.create.dimension.drawCallbackDrawPeriods = function (table, lngIsoCode) {
    // Delete action               
    $(table).find("[name=" + C_APP_NAME_LINK_DELETE + "]").once("click", function () {
        var params = {
            lngIsoCode: lngIsoCode,
            prdCode: $(this).attr("idn")
        };
        app.build.create.dimension.modal.deletePeriod(params);
    });
}

/**
 *Draw periods dimension
 * @param {*} lngIsoCode
 * @param {*} data
 */
app.build.create.dimension.drawPeriods = function (lngIsoCode) {
    var data = null;
    $(app.build.create.initiate.data.Dimension).each(function (index, dimension) {
        if (lngIsoCode == dimension.LngIsoCode) {
            data = dimension.Frequency.Period;
        }
    });

    var table = $("#build-create-dimension-accordion-" + lngIsoCode).find("[name=periods-added-table]");

    if ($.fn.DataTable.isDataTable(table)) {
        app.library.datatable.reDraw(table, data);
    } else {
        var localOptions = {
            // Add Row Index to feed the ExtraInfo modal 
            createdRow: function (row, dataRow, dataIndex) {
                $(row).attr(C_APP_DATATABLE_ROW_INDEX, dataIndex);
            },
            data: data,
            ordering: false,
            columns: [
                {
                    data: "PrdCode"
                },
                {
                    data: "PrdValue"
                },
                {
                    data: null,
                    sorting: false,
                    searchable: false,
                    render: function (data, type, row) {
                        return app.library.html.deleteButton({ idn: row.PrdCode }, false);
                    },
                    "width": "1%"
                },
            ],
            drawCallback: function (settings) {
                app.build.create.dimension.drawCallbackDrawPeriods(table, lngIsoCode);
            },

        };

        $(table).DataTable($.extend(true, {}, app.config.plugin.datatable, localOptions)).on('responsive-display', function (e, datatable, row, showHide, update) {
            app.build.create.dimension.drawCallbackDrawPeriods(table, lngIsoCode);
        });
    }
};

/**
 * Confirm deletion of classification for parameters entered.
 *
 * @param {*} params
 */
app.build.create.dimension.modal.deletePeriod = function (params) {
    api.modal.confirm(
        app.library.html.parseDynamicLabel("create-sure-want-delete-time-period", [params.prdCode]),
        app.build.create.dimension.callback.deletePeriod,
        params
    );
};

app.build.create.dimension.callback.deletePeriod = function (params) {
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
        if (dimension.LngIsoCode == params.lngIsoCode) {
            $.each(dimension.Frequency.Period, function (index, variable) {
                if (variable.PrdCode == params.prdCode) {
                    dimension.Frequency.Period.splice(index, 1);
                }
            });
        }
    });
    app.build.create.dimension.drawPeriods(params.lngIsoCode);
};

app.build.create.dimension.callback.deleteAllPeriods = function (lngIsoCode) {
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
        if (dimension.LngIsoCode == lngIsoCode) {
            dimension.Frequency.Period = [];
        }
    });
    app.build.create.dimension.drawPeriods(lngIsoCode);
};


//#endregion

//#region submit object

//Build the PX file
app.build.create.dimension.buildDataObject = function () {
    var errors = [];
    var numStatistics = [];
    var numClassifications = [];
    //app.build.create.dimension.dataObjectValid
    $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
        var dimensionCodes = [];
        var dimensionValues = [];
        var lngIsoCode = dimension.LngIsoCode;
        var lngIsoName = null;
        $.each(app.build.create.initiate.languages, function (key, language) {
            if (lngIsoCode == language.code) {
                lngIsoName = language.name;
            }
        });
        //MtrTitle
        dimension.MtrTitle = $("#build-create-dimension-accordion-" + lngIsoCode).find("[name=title-value]").val().trim();
        //StatisticLabel
        dimension.StatisticLabel = $("#build-create-dimension-accordion-" + lngIsoCode).find("[name=statistic-label]").val().trim();
        //Note
        var tinyMceId = $("#build-create-dimension-accordion-" + lngIsoCode).find("[name=note-value]").attr("id");
        dimension.MtrNote = tinymce.get(tinyMceId).getContent();
        //Frequency Label
        dimension.Frequency.FrqValue = $("#build-create-dimension-accordion-" + lngIsoCode).find("[name=frequency-value]").val().trim();

        //check for at least one statistic and one classification
        if (!dimension.Statistic.length) {
            errors.push(app.library.html.parseDynamicLabel("create-statistic", [lngIsoName]));
            return;
        }
        if (!dimension.Classification.length) {
            errors.push(app.library.html.parseDynamicLabel("create_classification", [lngIsoName]));
            return;
        }
        if (!dimension.Frequency.Period.length) {
            errors.push(app.library.html.parseDynamicLabel("create-period", [lngIsoName]));
            return;
        }
        //get length of statistics and classifications per language
        numStatistics.push(dimension.Statistic.length);
        numClassifications.push(dimension.Classification.length);
        //check statistic codes per language
        $.each(dimension.Classification, function (key, value) {
            dimensionCodes.push(value.ClsCode);
            dimensionValues.push(value.ClsValue);
        });
        dimensionValues.push(dimension.StatisticLabel);
        if (app.library.utility.arrayHasDuplicate(dimensionCodes)) {
            errors.push(app.library.html.parseDynamicLabel("create_dimension_code", [lngIsoName]));
        }
        if (app.library.utility.arrayHasDuplicate(dimensionValues)) {
            errors.push(app.library.html.parseDynamicLabel("build-dimension", [lngIsoName]));
        }
    });
    if (!errors.length) {
        //check if number of statistics are equal for all languages
        if (!numStatistics.every((val, i, arr) => val === arr[0])) {
            errors.push(app.label.static["create-statistic"]);
        }
        //check if number of classifications are equal for all languages
        if (!numClassifications.every((val, i, arr) => val === arr[0])) {
            errors.push(label.static["create-classification"]);
        }
    }
    if (!errors.length) {
        //compare default language statistic codes, statistical decimal and classification codes to every other language. 
        var defaultLngStatisticCodes = [];
        var defaultLngStatisticDecimals = [];
        var defaultLngClassificationCodes = [];
        $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
            if (dimension.LngIsoCode == app.config.language.iso.code) {
                $.each(dimension.Statistic, function (index, statistic) {
                    defaultLngStatisticCodes.push(statistic.SttCode);
                    defaultLngStatisticDecimals.push(statistic.SttDecimal);
                });

                $.each(dimension.Classification, function (index, statistic) {
                    defaultLngClassificationCodes.push(statistic.ClsCode);
                });
            }
        });
        $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
            var lngIsoCode = dimension.LngIsoCode;
            var lngIsoName = null;
            $.each(app.build.create.initiate.languages, function (key, language) {
                if (lngIsoCode == language.code) {
                    lngIsoName = language.name;
                }
            });
            var statisticCodes = [];
            var statisticDecimals = [];
            var classificationCodes = [];
            if (lngIsoCode != app.config.language.iso.code) {
                $.each(dimension.Statistic, function (index, statistic) {
                    statisticCodes.push(statistic.SttCode);
                    statisticDecimals.push(statistic.SttDecimal);
                });
                // If not the same, throw error
                if (!app.library.utility.arraysEqual(defaultLngStatisticCodes, statisticCodes)) {
                    errors.push(app.library.html.parseDynamicLabel("create-statistic-code", [lngIsoName, app.config.language.iso.name]));
                }
                if (!app.library.utility.arraysEqual(defaultLngStatisticDecimals, statisticDecimals)) {
                    errors.push(app.library.html.parseDynamicLabel("create-statistic-decimal", [lngIsoName, app.config.language.iso.name]));
                }

                $.each(dimension.Classification, function (index, classification) {
                    classificationCodes.push(classification.ClsCode);
                });
                // If not the same, throw error
                if (!app.library.utility.arraysEqual(defaultLngClassificationCodes, classificationCodes)) {
                    errors.push(app.library.html.parseDynamicLabel("create-classification-code", [lngIsoName, app.config.language.iso.name]));
                }
            }
        });
        if (!errors.length) {


            //check that variable codes for each classification are the same accross all languages
            //loop through each classification
            $.each(defaultLngClassificationCodes, function (index, classification) {
                var defaultVariableCodes = [];
                var compareVariableCodes = [];
                var compareLngIsoName = null;
                var defaultLngClassificationCode = null;


                //loop through dimensions and find variable codes for default language for this classification
                $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
                    if (dimension.LngIsoCode == app.config.language.iso.code) { //default language
                        //loop through the classifications in default language to get specific classification and then put variables in array
                        $.each(dimension.Classification, function (index, dimensionClassification) {
                            if (dimensionClassification.ClsCode == classification) {
                                //this is the classification we are looking for, put variable codes into array
                                $.each(dimensionClassification.Variable, function (index, variable) {
                                    defaultVariableCodes.push(variable.VrbCode)
                                });

                            }
                        });
                    }

                });

                //loop through dimensions and find variable codes for other languages for this classification
                $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
                    if (dimension.LngIsoCode != app.config.language.iso.code) { //not default language
                        $.each(app.build.create.initiate.languages, function (key, language) {
                            if (dimension.LngIsoCode == language.code) {
                                compareLngIsoName = language.name;
                            }
                        });

                        //loop through the classifications in this language to get specific classification and then put variables in array
                        $.each(dimension.Classification, function (index, dimensionClassification) {
                            if (dimensionClassification.ClsCode == classification) {
                                defaultLngClassificationCode = dimensionClassification.ClsCode;
                                //this is the classification we are looking for, put variable codes into array
                                compareVariableCodes = [];
                                $.each(dimensionClassification.Variable, function (index, variable) {
                                    compareVariableCodes.push(variable.VrbCode)
                                });

                            }
                        });
                        //compare variable array of default language against this language
                        if (!app.library.utility.arraysEqual(defaultVariableCodes, compareVariableCodes)) {
                            errors.push(app.library.html.parseDynamicLabel("create-classification-variable-code", [compareLngIsoName, app.config.language.iso.name, defaultLngClassificationCode]));
                        }

                    }

                });

            });
        };

        //validate period codes
        if (!errors.length) {
            var numPeriods = [];
            $(app.build.create.initiate.data.Dimension).each(function (index, dimension) {
                numPeriods.push(dimension.Frequency.Period.length);
            });

            if (!numPeriods.every((val, i, arr) => val === arr[0])) {
                errors.push(app.label.static["build-not-equal-languages"]);
            }
        }

        //check that period codes for are the same for all languages
        if (!errors.length) {
            var defaultLngPeriodCodes = [];
            //get default language codes
            $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
                if (dimension.LngIsoCode == app.config.language.iso.code) {
                    $.each(dimension.Frequency.Period, function (index, period) {
                        defaultLngPeriodCodes.push(period.PrdCode);
                    });
                }
            });
            //compare other language period codes to default period codes
            $.each(app.build.create.initiate.data.Dimension, function (index, dimension) {
                var lngIsoCode = dimension.LngIsoCode;
                var lngIsoName = null;
                //get language name for error description
                $.each(app.build.create.initiate.languages, function (key, language) {
                    if (lngIsoCode == language.lngIsoCode) {
                        lngIsoName = language.name;
                    }
                });
                var periodCodes = [];

                if (lngIsoCode != app.config.language.iso.code) {
                    $.each(dimension.Frequency.Period, function (index, period) {
                        periodCodes.push(period.PrdCode);
                    });
                    // If not the same, throw error
                    if (!app.library.utility.arraysEqual(defaultLngPeriodCodes, periodCodes)) {
                        errors.push(app.library.html.parseDynamicLabel("build-period-codes", [lngIsoName, app.config.language.iso.name]));
                    }
                }
            });
        }
    }
    if (!errors.length) {
        $("#build-create-dimensions").find("[name=dimension-error-card]").hide();
        app.build.create.dimension.ajax.create(app.build.create.initiate.data);
    }
    else {
        $("#build-create-dimensions").find("[name=dimension-error]").empty();
        $("#build-create-dimensions").find("[name=dimension-error-card]").show();
        var errorOutput = $("<ul>", {
            class: "list-group"
        });
        $.each(errors, function (_index, value) {
            var error = $("<li>", {
                class: "list-group-item",
                html: value
            });
            errorOutput.append(error);
        });
        $("#build-create-dimensions").find("[name=dimension-error]").html(errorOutput.get(0).outerHTML);
        api.modal.error(errorOutput);
    }
};

/**
 *Get px file
 *
 * @param {*} params
 */
app.build.create.dimension.ajax.create = function (params) {
    api.ajax.jsonrpc.request(
        app.config.url.api.private,
        "PxStat.Build.Build_API.Create",
        params,
        "app.build.create.dimension.callback.create",
        params.FrmType,
        null,
        null,
        { async: false });
};

/**
 *Download px file
 *
 * @param {*} response
 */
app.build.create.dimension.callback.create = function (response, format) {
    if (response.error) {
        api.modal.error(response.error.message);
    }

    else if (!response.data || (Array.isArray(response.data) && !response.data.length)) {
        api.modal.information(app.label.static["api-ajax-nodata"]);
    }
    else if (response.data) {

        var mimeType = "";
        var fileExtension = "";
        var fileName = $("#build-create-initiate-setup [name=mtr-value]").val() + "." + moment(Date.now()).format(app.config.mask.datetime.file);

        switch (format) {
            case C_APP_TS_FORMAT_TYPE_JSONSTAT:
                mimeType = "application/json";
                fileExtension = C_APP_EXTENSION_JSONSTAT;
                break;
            case C_APP_TS_FORMAT_TYPE_PX:
                mimeType = "text/plain";
                fileExtension = C_APP_EXTENSION_PX;
                break;
            default:
                api.modal.exception(app.label.static["api-ajax-exception"]);
                return;
                break;
        };

        $.each(response.data, function (index, file) {
            var fileData = null;
            switch (format) {
                case C_APP_TS_FORMAT_TYPE_JSONSTAT:
                    fileData = JSON.stringify(file);
                    //Append language iso code
                    fileName += "." + JSONstat(file).extension.language.code;
                    break;
                case C_APP_TS_FORMAT_TYPE_PX:
                    fileData = file;
                    break;
            };

            var blob = new Blob([fileData], { type: mimeType });
            var downloadUrl = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName + '.' + fileExtension;
            if (document.createEvent) {
                // https://developer.mozilla.org/en-US/docs/Web/API/Document/createEvent
                var event = document.createEvent('MouseEvents');
                event.initEvent('click', true, true);
                a.dispatchEvent(event);
            }
            else {
                a.click();
            }
        });



        api.modal.success(app.label.static["create-success"]);
    }
    // Handle Exception
    else api.modal.exception(app.label.static["api-ajax-exception"]);
};

//#endregion
//#region validation

/**
 * Validate the properties entered for the Matrix
 * @param {*} LngIsoCode
 */
app.build.create.dimension.validation.properties = function (LngIsoCode) {
    $("#build-create-dimension-accordion-collapse-properties-" + LngIsoCode).find("form").trigger("reset").onSanitiseForm().validate({
        onkeyup: function (element) {
            this.element(element);
        },
        rules: {
            "title-value": {
                required: true
            },
            "frequency-value": {
                required: true,
                notEqual: $("#build-create-dimension-accordion-collapse-properties-" + LngIsoCode).find("[name=statistic-label]")
            },
            "statistic-label": {
                required: true
            },
        },
        invalidHandler: function (event, validator) {
            app.build.create.dimension.propertiesValid = false;
        },
        errorPlacement: function (error, element) {
            $("#build-create-dimension-accordion-collapse-properties-" + LngIsoCode).find('[name=' + element[0].name + '-error-holder]').append(error[0]);
        },
        submitHandler: function (form) {
            $(form).sanitiseForm();
            app.build.create.dimension.propertiesValid = true;
        }
    }).resetForm();
};
//reset classifications
app.build.create.dimension.validation.manualClassification = function () {
    $("#build-create-manual-classification").find("form").trigger("reset").onSanitiseForm().validate({
        onkeyup: function (element) {
            this.element(element);
        },
        rules: {
            "cls-code": {
                required: true
            },
            "cls-value": {
                required: true
            },
            'cls-geo-url': {
                url: true
            }
        },
        errorPlacement: function (error, element) {
            $("#build-create-manual-classification").find('[name=' + element[0].name + '-error-holder]').append(error[0]);
        },
        submitHandler: function (form) {
            $(form).sanitiseForm();
            app.build.create.dimension.callback.buildManualClassification();
        }
    }).resetForm();
};
//reset upload classifications
app.build.create.dimension.validation.uploadClassification = function () {
    $("#build-create-upload-classification").find("form").trigger("reset").onSanitiseForm().validate({
        onkeyup: function (element) {
            this.element(element);
        },
        rules: {
            "cls-code": {
                required: true
            },
            "cls-value": {
                required: true
            },
            'cls-geo-url': {
                url: true
            }
        },
        errorPlacement: function (error, element) {
            $("#build-create-upload-classification").find('[name=' + element[0].name + '-error-holder]').append(error[0]);
        },
        submitHandler: function (form) {
            $(form).sanitiseForm();
            app.build.create.dimension.callback.buildUploadClassification();
        }
    }).resetForm();
};

//#endregion