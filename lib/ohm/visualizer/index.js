/* eslint-env browser */
/* global CodeMirror, d3, ohm */

'use strict';

var ArrayProto = Array.prototype;
function $(sel) { return document.querySelector(sel); }
var options = {};

var inputEditor = CodeMirror.fromTextArea($('#input'));
var grammarEditor = CodeMirror.fromTextArea($('#grammar'));
var grammar;

// D3 Helpers
// ----------

function currentHeightPx(optEl) {
  return (optEl || this).offsetHeight + 'px';
}

function tweenWithCallback(endValue, cb) {
  return function tween(d, i, a) {
    var interp = d3.interpolate(a, endValue);
    return function(t) {
      var stepValue = interp.apply(this, arguments);
      cb(stepValue);
      return stepValue;
    };
  };
}

// CodeMirror Helpers
// ------------------

function countLeadingWhitespace(str) {
  return str.match(/^\s*/)[0].length;
}

function countTrailingWhitespace(str) {
  return str.match(/\s*$/)[0].length;
}

function isBlockSelectable(cm, startPos, endPos) {
  var lastLine = cm.getLine(endPos.line);
  return countLeadingWhitespace(cm.getLine(startPos.line)) === startPos.ch &&
         (lastLine.length - countTrailingWhitespace(lastLine)) === endPos.ch;
}

// Mark a block of text with `className` by marking entire lines.
function markBlock(cm, startLine, endLine, className) {
  for (var i = startLine; i <= endLine; ++i) {
    cm.addLineClass(i, 'wrap', className);
  }
  return {
    clear: function() {
      for (var i = startLine; i <= endLine; ++i) {
        cm.removeLineClass(i, 'wrap', className);
      }
    }
  };
}

function markInterval(cm, interval, className) {
  var startPos = cm.posFromIndex(interval.startIdx);
  var endPos = cm.posFromIndex(interval.endIdx);

  // See if the selection can be expanded to a block selection.
  if (isBlockSelectable(cm, startPos, endPos)) {
    return markBlock(cm, startPos.line, endPos.line, className);
  }
  cm.getWrapperElement().classList.add('highlighting');
  return cm.markText(startPos, endPos, {className: className});
}

function clearMark(cm, mark) {
  if (mark) {
    mark.clear();
  }
  cm.getWrapperElement().classList.remove('highlighting');
}

// Misc Helpers
// ------------

// Returns an array of elements whose width could depend on `el`, including
// the element itself.
function getWidthDependentElements(el) {
  var els = [el];
  // Add all ancestor pexpr nodes.
  var node = el;
  while ((node = node.parentNode) !== document) {
    if (node.classList.contains('pexpr')) {
      els.push(node);
    }
  }
  // And add all descendent pexpr nodes.
  return els.concat(ArrayProto.slice.call(el.querySelectorAll('.pexpr')));
}

// For each pexpr div in `els`, updates the width of its associated input
// span based on the current width of the pexpr. This ensures the input text
// for each pexpr node appears directly above it in the visualization.
function updateInputWidths(els) {
  for (var i = 0; i < els.length; ++i) {
    var el = els[i];
    if (!el._input) {
      continue;
    }
    el._input.style.minWidth = el.offsetWidth + 'px';
    if (!el.style.minWidth) {
      el.style.minWidth = measureInput(el._input).width + 'px';
    }
  }
}

function initializeWidths() {
  var els = getWidthDependentElements($('.pexpr'));

  // First, ensure that each pexpr node must be as least as wide as the width
  // of its associated input text.
  for (var i = 0; i < els.length; ++i) {
    els[i].style.minWidth = measureInput(els[i]._input).width + 'px';
  }

  // Then, set the initial widths of all the input elements.
  updateInputWidths(els);
}

function createElement(sel, optContent) {
  var parts = sel.split('.');
  var tagName = parts[0];
  if (tagName.length === 0) {
    tagName = 'div';
  }

  var el = document.createElement(tagName);
  el.className = parts.slice(1).join(' ');
  if (optContent) {
    el.textContent = optContent;
  }
  return el;
}

function measureLabel(wrapperEl) {
  var tempWrapper = $('#measuringDiv .pexpr');
  var labelClone = wrapperEl.querySelector('.label').cloneNode(true);
  var clone = tempWrapper.appendChild(labelClone);
  var result = {
    width: clone.offsetWidth,
    height: clone.offsetHeight
  };
  tempWrapper.innerHTML = '';
  return result;
}

function measureChildren(wrapperEl) {
  var measuringDiv = $('#measuringDiv');
  var clone = measuringDiv.appendChild(wrapperEl.cloneNode(true));
  clone.style.width = '';
  var children = clone.lastChild;
  children.hidden = !children.hidden;
  var result = {
    width: children.offsetWidth,
    height: children.offsetHeight
  };
  measuringDiv.removeChild(clone);
  return result;
}

function measureInput(inputEl) {
  var measuringDiv = $('#measuringDiv');
  var span = measuringDiv.appendChild(createElement('span.input'));
  span.innerHTML = inputEl.textContent;
  var result = {
    width: span.offsetWidth,
    height: span.offsetHeight
  };
  measuringDiv.removeChild(span);
  return result;
}

// Hides or shows the children of `el`, which is a div.pexpr.
function toggleTraceElement(el) {
  var children = el.lastChild;
  var showing = children.hidden;

  var childrenSize = measureChildren(el);
  var newWidth = showing ? childrenSize.width : measureLabel(el).width;

  // The pexpr can't be smaller than the input text.
  newWidth = Math.max(newWidth, measureInput(el._input).width);

  var widthDeps = getWidthDependentElements(el);

  d3.select(el)
      .transition()
      .duration(500)
      .styleTween('width', tweenWithCallback(newWidth + 'px', function(v) {
        updateInputWidths(widthDeps);
      }))
      .each('end', function() {
        // Remove the width and allow the flexboxes to adjust to the correct
        // size. If there is a glitch when this happens, we haven't calculated
        // `newWidth` correctly.
        this.style.width = '';
      });

  var height = showing ? childrenSize.height : 0;
  d3.select(el.lastChild).style('height', currentHeightPx)
      .transition()
      .duration(500)
      .style('height', height + 'px')
      .each('start', function() { if (showing) { this.hidden = false; } })
      .each('end', function() {
        if (!showing) {
          this.hidden = true;
        }
        this.style.height = '';
      });
}

function createTraceElement(traceNode, container, input) {
  var wrapper = container.appendChild(createElement('.pexpr'));
  wrapper.classList.add(traceNode.expr.constructor.name.toLowerCase());
  if (!traceNode.succeeded) {
    wrapper.classList.add('failed');
  }

  wrapper.addEventListener('click', function(e) {
    if (e.altKey && !(e.shiftKey || e.metaKey)) {
      console.log(traceNode);  // eslint-disable-line no-console
    } else {
      toggleTraceElement(wrapper);
    }
    e.stopPropagation();
    e.preventDefault();
  });

  var inputMark, grammarMark, defMark;
  wrapper.addEventListener('mouseover', function(e) {
    if (input) {
      input.classList.add('highlight');
    }
    if (traceNode.interval) {
      inputMark = markInterval(inputEditor, traceNode.interval, 'highlight');
    }
    if (traceNode.expr.interval) {
      grammarMark = markInterval(grammarEditor, traceNode.expr.interval, 'active-appl');
    }
    var ruleName = traceNode.expr.ruleName;
    if (ruleName) {
      var defInterval = grammar.ruleDict[ruleName].definitionInterval;
      if (defInterval) {
        defMark = markInterval(grammarEditor, defInterval, 'active-definition');
      }
    }
    e.stopPropagation();
  });
  wrapper.addEventListener('mouseout', function(e) {
    if (input) {
      input.classList.remove('highlight');
    }
    clearMark(inputEditor, inputMark);
    clearMark(grammarEditor, grammarMark);
    clearMark(grammarEditor, defMark);
  });
  wrapper._input = input;

  var label = wrapper.appendChild(createElement('.label', traceNode.displayString));
  if (isPrimitive(traceNode.expr)) {
    label.classList.add('prim');
  }

  return wrapper;
}

// A blackhole node is hidden and makes all its descendents hidden too.
function isBlackhole(traceNode) {
  if (traceNode.expr.constructor.name === 'Many' && !options.showFailures) {
    // Not sure if this is exactly right. Maybe better would be to hide the
    // node if it doesn't have any visible children.
    return !traceNode.interval || traceNode.interval.contents.length === 0;
  }

  if (traceNode.replacedBy) {
    return true;
  }

  var desc = traceNode.displayString;
  if (desc) {
    return desc[desc.length - 1] === '_' ||
           desc === 'space' ||
           desc === 'empty';
  }
  return false;
}

function shouldNodeBeVisible(traceNode) {
  // TODO: We need to distinguish between nodes that nodes that should be
  // hidden and nodes that should be collapsed by default.

  if (isBlackhole(traceNode)) {
    return false;
  }

  switch (traceNode.expr.constructor.name) {
    case 'Seq':
    case 'Alt':
      return false;
    case 'Apply':
      // Don't show a separate node for failed inline rule applications.
      return traceNode.succeeded || traceNode.expr.ruleName.indexOf('_') === -1;
    default:
      // Hide things that don't correspond to something the user wrote.
      if (!traceNode.expr.interval) {
        return false;
      }
  }
  return true;
}

function isPrimitive(expr) {
  return expr.constructor.name.indexOf('Prim') >= 0;
}

// Main
// ----

(function main() {
  var checkboxes = document.querySelectorAll('#options input[type=checkbox]');
  var refreshTimeout;
  function triggerRefresh(delay) {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    refreshTimeout = setTimeout(refresh, delay || 0);
  }
  Array.prototype.forEach.call(checkboxes, function(cb) {
    cb.addEventListener('click', function(e) { triggerRefresh(); });
  });
  inputEditor.on('change', function() { triggerRefresh(150); });
  grammarEditor.on('change', function() { triggerRefresh(150); });

  function refresh() {
    var grammarSrc = grammarEditor.getValue();

    try {
      grammar = ohm.grammar(grammarSrc);
    } catch (e) {
      console.log(e);  // eslint-disable-line no-console
      return;
    }
    var trace = grammar.trace(inputEditor.getValue(), 'Expr').trace;

    // Refresh the option values.
    for (var i = 0; i < checkboxes.length; ++i) {
      var checkbox = checkboxes[i];
      options[checkbox.name] = checkbox.checked;
    }

    $('#expandedInput').innerHTML = '';
    $('#parseResults').innerHTML = '';
    (function walkTraceNodes(nodes, container, inputContainer, showTrace, printInput, parent) {
      nodes.forEach(function(node) {
        if (!node) {
          // FIXME -- What's going on here??
          return;
        }
        if (!(options.showFailures || node.succeeded)) {
          return;
        }
        var contents = '';
        if (node.succeeded) {
          contents = isPrimitive(node.expr) ? node.interval.contents : '';
        }
        var childInput;
        var shouldPrintInput = printInput && node.succeeded && !node.replacedBy;
        var isWhitespace = contents.length > 0 && contents.trim().length === 0;
        if (shouldPrintInput) {
          childInput = inputContainer.appendChild(createElement('span.input', contents));
          if (isWhitespace) {
            childInput.innerHTML = '&#xb7;';  // Unicode Character 'MIDDLE DOT'
            childInput.classList.add('whitespace');
          }
        }

        var shouldShowTrace = showTrace && !isBlackhole(node);
        var childContainer = container;

        if (shouldShowTrace || isWhitespace || nodes === trace) {
          var el = createTraceElement(node, container, childInput);
          childContainer = el.appendChild(createElement('.children'));
          if (!shouldNodeBeVisible(node)) {
            el.classList.add('hidden');
          }
          if (isWhitespace) {
            el.classList.add('whitespace');
          }
          if (!node.succeeded) {
            el.classList.add('failed');
          }
        }
        walkTraceNodes(
            node.children, childContainer, childInput, shouldShowTrace, shouldPrintInput, node);

        // For Seq nodes, also display children that weren't evaluated.
        // TODO: Consider handling this when the trace is being recorded.
        if (options.showFailures && node.expr.constructor.name === 'Seq') {
          var factors = node.expr.factors;

          // Due to implicit rules like `spaces_`, the accounting here is a bit
          // tricky. This should probably be handled inside PExpr eval, not here.
          var skipCount = childContainer.querySelectorAll('.pexpr').length;

          for (var i = skipCount; i < factors.length; ++i) {
            var wrapper = createElement('.pexpr.unevaluated');
            wrapper.appendChild(createElement('.label', factors[i].toDisplayString()));
            childContainer.appendChild(wrapper);
          }
          if (parent && parent.expr.constructor.name === 'Apply') {
            var ruleName = parent.expr.ruleName;
            var caseName = ruleName.slice(ruleName.lastIndexOf('_') + 1);
            if (caseName !== ruleName) {
              childContainer.appendChild(createElement('.caseName', caseName));
            }
          }
        }
      });
    })(trace, $('#parseResults'), $('#expandedInput'), true, true, null);
    initializeWidths();
  }
  refresh();
})();
