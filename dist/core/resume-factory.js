
/**
Definition of the ResumeFactory class.
@license MIT. See LICENSE.md for details.
@module core/resume-factory
 */

(function() {
  var FS, HME, HMS, ResumeConverter, ResumeFactory, SyntaxErrorEx, _, _parse, chalk, resumeDetect;

  FS = require('fs');

  HMS = require('./status-codes');

  HME = require('./event-codes');

  ResumeConverter = require('fresh-jrs-converter');

  chalk = require('chalk');

  SyntaxErrorEx = require('../utils/syntax-error-ex');

  _ = require('underscore');

  resumeDetect = require('../utils/resume-detector');

  require('string.prototype.startswith');


  /**
  A simple factory class for FRESH and JSON Resumes.
  @class ResumeFactory
   */

  ResumeFactory = module.exports = {

    /**
    Load one or more resumes from disk.
    
    @param {Object} opts An options object with settings for the factory as well
    as passthrough settings for FRESHResume or JRSResume. Structure:
    
        {
          format: 'FRESH',    // Format to open as. ('FRESH', 'JRS', null)
          objectify: true,    // FRESH/JRSResume or raw JSON?
          inner: {            // Passthru options for FRESH/JRSResume
            sort: false
          }
        }
     */
    load: function(sources, opts, emitter) {
      return sources.map(function(src) {
        return this.loadOne(src, opts, emitter);
      }, this);
    },

    /** Load a single resume from disk. */
    loadOne: function(src, opts, emitter) {
      var ResumeClass, info, json, objectify, orgFormat, reqLib, rez, toFormat;
      toFormat = opts.format;
      objectify = opts.objectify;
      toFormat && (toFormat = toFormat.toLowerCase().trim());
      info = _parse(src, opts, emitter);
      if (info.fluenterror) {
        return info;
      }
      json = info.json;
      orgFormat = resumeDetect(json);
      if (orgFormat === 'unk') {
        info.fluenterror = HMS.unknownSchema;
        return info;
      }
      if (toFormat && (orgFormat !== toFormat)) {
        json = ResumeConverter['to' + toFormat.toUpperCase()](json);
      }
      rez = null;
      if (objectify) {
        reqLib = '../core/' + (toFormat || orgFormat) + '-resume';
        ResumeClass = require(reqLib);
        rez = new ResumeClass().parseJSON(json, opts.inner);
        rez.i().file = src;
      }
      return {
        file: src,
        json: info.json,
        rez: rez
      };
    }
  };

  _parse = function(fileName, opts, eve) {
    var orgFormat, rawData, ret;
    rawData = null;
    try {
      eve && eve.stat(HME.beforeRead, {
        file: fileName
      });
      rawData = FS.readFileSync(fileName, 'utf8');
      eve && eve.stat(HME.afterRead, {
        file: fileName,
        data: rawData
      });
      eve && eve.stat(HME.beforeParse, {
        data: rawData
      });
      ret = {
        json: JSON.parse(rawData)
      };
      orgFormat = ret.json.meta && ret.json.meta.format && ret.json.meta.format.startsWith('FRESH@') ? 'fresh' : 'jrs';
      eve && eve.stat(HME.afterParse, {
        file: fileName,
        data: ret.json,
        fmt: orgFormat
      });
      return ret;
    } catch (_error) {
      return {
        fluenterror: rawData ? HMS.parseError : HMS.readError,
        inner: _error,
        raw: rawData,
        file: fileName
      };
    }
  };

}).call(this);

//# sourceMappingURL=resume-factory.js.map
