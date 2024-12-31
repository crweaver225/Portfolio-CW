(() => {
  // ns-hugo-imp:/Users/christopherweaver/desktop/portfolio-cw/themes/hugo-liftoff/assets/js/components/switchTheme.js
  function switchTheme() {
    let themeSwitch = document.getElementById("themeSwitch");
    if (themeSwitch) {
      let initTheme = function() {
        let lsItem = localStorage.getItem("themeSwitch");
        let darkThemeSelected = false;
        if (lsItem !== null) {
          darkThemeSelected = lsItem === "dark";
        } else {
          darkThemeSelected = window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        themeSwitch.checked = darkThemeSelected;
        resetTheme();
      }, resetTheme = function() {
        if (themeSwitch.checked) {
          document.body.setAttribute("data-theme", "dark");
          localStorage.setItem("themeSwitch", "dark");
        } else {
          document.body.removeAttribute("data-theme");
          localStorage.setItem("themeSwitch", "light");
        }
        if (typeof DISQUS !== "undefined") {
          DISQUS.reset({ reload: true });
        }
      };
      initTheme();
      themeSwitch.addEventListener("change", () => {
        resetTheme();
      });
    }
  }
  var switcher = (() => {
    switchTheme();
  })();

  // ns-hugo-imp:/Users/christopherweaver/desktop/portfolio-cw/themes/hugo-liftoff/assets/js/components/clipboard.js
  var addCopyButtons = (clipboard2) => {
    document.querySelectorAll(".highlight > pre > code").forEach((codeBlock) => {
      const button = document.createElement("button");
      const svgCopy = '<svg role="img" aria-hidden="true" aria-labelledby="clipboardCopy" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true"><title id="clipboardCopy">Copy the code snippet contents</title><path fill-rule="evenodd" d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path><path fill-rule="evenodd" d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path></svg>';
      const svgCheck = '<svg role="img" aria-hidden="true" aria-labelledby="clipboardCheckmark" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true"><title id="clipboardCheckmark">Code snippet contents copied</title><path fill-rule="evenodd" fill="rgb(63, 185, 80)" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path></svg>';
      button.className = "clipboard-button";
      button.type = "button";
      button.innerHTML = svgCopy;
      button.addEventListener("click", () => {
        let textToCopy = "";
        let codeBlockChildren = Array.from(codeBlock.children);
        codeBlockChildren.forEach(function(span) {
          textToCopy += span.lastChild.innerText;
        });
        clipboard2.writeText(textToCopy).then(
          () => {
            button.blur();
            button.innerHTML = svgCheck;
            setTimeout(() => button.innerHTML = svgCopy, 2e3);
          },
          (error) => button.innerHTML = "Error"
        );
      });
      const pre = codeBlock.parentNode;
      pre.parentNode.insertBefore(button, pre);
    });
  };
  var clipboard = (() => {
    if (navigator && navigator.clipboard) {
      addCopyButtons(navigator.clipboard);
    }
  })();

  // ns-hugo-imp:/Users/christopherweaver/desktop/portfolio-cw/themes/hugo-liftoff/assets/js/components/toc.js
  var toggleToc = (() => {
    let tocToggle = document.getElementById("js-toc-toggle");
    let tocContents = document.getElementById("js-toc-contents");
    if (tocToggle) {
      tocToggle.addEventListener("click", () => {
        tocContents.classList.toggle("toc-contents--active");
      });
    }
  })();

  // ns-hugo-imp:/Users/christopherweaver/desktop/portfolio-cw/themes/hugo-liftoff/assets/js/layouts/header.js
  function toggleNav() {
    let mainMenu = document.getElementById("js-menu");
    let navBarToggle = document.getElementById("js-navbar-toggle");
    navBarToggle.addEventListener("click", () => {
      mainMenu.classList.toggle("menu--active");
      removeSubMenus();
    });
  }
  function toggleMobileMenu() {
    let menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(function(item) {
      item.addEventListener("click", () => {
        let subMenu = item.querySelector(".sub-menu");
        if (subMenu.classList.contains("sub-menu--active")) {
          subMenu.classList.remove("sub-menu--active");
        } else {
          removeSubMenus();
          subMenu.classList.add("sub-menu--active");
        }
      });
    });
  }
  function removeSubMenus() {
    let subMenus = document.querySelectorAll(".sub-menu");
    subMenus.forEach(function(sub) {
      if (sub.classList.contains("sub-menu--active")) {
        sub.classList.remove("sub-menu--active");
      }
    });
  }
  var header = (() => {
    toggleNav();
    toggleMobileMenu();
  })();

  // ns-hugo-imp:/Users/christopherweaver/desktop/portfolio-cw/themes/hugo-liftoff/assets/js/pages/home.js
  function filterPosts() {
    let selectPosts = document.getElementById("select-posts");
    let entries = document.querySelectorAll(".post-entry-filter");
    if (selectPosts) {
      selectPosts.addEventListener("change", () => {
        entries.forEach(function(entry) {
          if (entry.classList.contains(`entry--${selectPosts.value}`) | selectPosts.value === "all-posts") {
            entry.style.display = "block";
          } else {
            entry.style.display = "none";
          }
        });
      });
    }
  }
  var home = (() => {
    filterPosts();
  })();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibnMtaHVnby1pbXA6L1VzZXJzL2NocmlzdG9waGVyd2VhdmVyL2Rlc2t0b3AvcG9ydGZvbGlvLWN3L3RoZW1lcy9odWdvLWxpZnRvZmYvYXNzZXRzL2pzL2NvbXBvbmVudHMvc3dpdGNoVGhlbWUuanMiLCAibnMtaHVnby1pbXA6L1VzZXJzL2NocmlzdG9waGVyd2VhdmVyL2Rlc2t0b3AvcG9ydGZvbGlvLWN3L3RoZW1lcy9odWdvLWxpZnRvZmYvYXNzZXRzL2pzL2NvbXBvbmVudHMvY2xpcGJvYXJkLmpzIiwgIm5zLWh1Z28taW1wOi9Vc2Vycy9jaHJpc3RvcGhlcndlYXZlci9kZXNrdG9wL3BvcnRmb2xpby1jdy90aGVtZXMvaHVnby1saWZ0b2ZmL2Fzc2V0cy9qcy9jb21wb25lbnRzL3RvYy5qcyIsICJucy1odWdvLWltcDovVXNlcnMvY2hyaXN0b3BoZXJ3ZWF2ZXIvZGVza3RvcC9wb3J0Zm9saW8tY3cvdGhlbWVzL2h1Z28tbGlmdG9mZi9hc3NldHMvanMvbGF5b3V0cy9oZWFkZXIuanMiLCAibnMtaHVnby1pbXA6L1VzZXJzL2NocmlzdG9waGVyd2VhdmVyL2Rlc2t0b3AvcG9ydGZvbGlvLWN3L3RoZW1lcy9odWdvLWxpZnRvZmYvYXNzZXRzL2pzL3BhZ2VzL2hvbWUuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIEFkYXB0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vQ29keUhvdXNlL2RhcmstbGlnaHQtbW9kZS1zd2l0Y2hcblxuZnVuY3Rpb24gc3dpdGNoVGhlbWUoKSB7XG4gIGxldCB0aGVtZVN3aXRjaCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVtZVN3aXRjaCcpO1xuICBpZiAodGhlbWVTd2l0Y2gpIHtcbiAgICBpbml0VGhlbWUoKTtcblxuICAgIHRoZW1lU3dpdGNoLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgIHJlc2V0VGhlbWUoKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGluaXRUaGVtZSgpIHtcbiAgICAgIGxldCBsc0l0ZW0gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndGhlbWVTd2l0Y2gnKTtcbiAgICAgIGxldCBkYXJrVGhlbWVTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgaWYgKGxzSXRlbSAhPT0gbnVsbCkge1xuICAgICAgICBkYXJrVGhlbWVTZWxlY3RlZCA9IGxzSXRlbSA9PT0gJ2RhcmsnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGFya1RoZW1lU2VsZWN0ZWQgPSB3aW5kb3cubWF0Y2hNZWRpYSgnKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKScpLm1hdGNoZXM7XG4gICAgICB9XG5cbiAgICAgIHRoZW1lU3dpdGNoLmNoZWNrZWQgPSBkYXJrVGhlbWVTZWxlY3RlZDtcbiAgICAgIHJlc2V0VGhlbWUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNldFRoZW1lKCkge1xuICAgICAgaWYgKHRoZW1lU3dpdGNoLmNoZWNrZWQpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGhlbWUnLCAnZGFyaycpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndGhlbWVTd2l0Y2gnLCAnZGFyaycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtdGhlbWUnKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3RoZW1lU3dpdGNoJywgJ2xpZ2h0Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlc2V0IERpc3F1cyB0byBtYXRjaCBuZXcgY29sb3Igc2NoZW1lXG4gICAgICBpZiAodHlwZW9mIERJU1FVUyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIERJU1FVUy5yZXNldCh7IHJlbG9hZDogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuY29uc3Qgc3dpdGNoZXIgPSAoKCkgPT4ge1xuICBzd2l0Y2hUaGVtZSgpO1xufSkoKTtcblxuZXhwb3J0IHsgc3dpdGNoZXIgfTsiLCAiLy8gQWRhcHRlZCBmcm9tIHRoZSBmb2xsb3dpbmcgdHV0b3JpYWxzOlxuLy8gaHR0cHM6Ly93d3cuZGFubnlndW8uY29tL2Jsb2cvaG93LXRvLWFkZC1jb3B5LXRvLWNsaXBib2FyZC1idXR0b25zLXRvLWNvZGUtYmxvY2tzLWluLWh1Z28vXG4vLyBodHRwczovL2Fhcm9ubHVuYS5kZXYvYmxvZy9hZGQtY29weS1idXR0b24tdG8tY29kZS1ibG9ja3MtaHVnby1jaHJvbWEvXG4vLyBodHRwczovL2xvZ2ZldGNoLmNvbS9odWdvLWFkZC1jb3B5LXRvLWNsaXBib2FyZC1idXR0b24vXG5cbmNvbnN0IGFkZENvcHlCdXR0b25zID0gKGNsaXBib2FyZCkgPT4ge1xuICAvLyAxLiBMb29rIGZvciBwcmUgPiBjb2RlIGVsZW1lbnRzIGluIHRoZSBET01cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmhpZ2hsaWdodCA+IHByZSA+IGNvZGUnKS5mb3JFYWNoKChjb2RlQmxvY2spID0+IHtcbiAgICAvLyAyLiBDcmVhdGUgYSBidXR0b24gdGhhdCB3aWxsIHRyaWdnZXIgYSBjb3B5IG9wZXJhdGlvblxuICAgIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgIGNvbnN0IHN2Z0NvcHkgPSAnPHN2ZyByb2xlPVwiaW1nXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgYXJpYS1sYWJlbGxlZGJ5PVwiY2xpcGJvYXJkQ29weVwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIHZlcnNpb249XCIxLjFcIiB3aWR0aD1cIjE2XCIgZGF0YS12aWV3LWNvbXBvbmVudD1cInRydWVcIj48dGl0bGUgaWQ9XCJjbGlwYm9hcmRDb3B5XCI+Q29weSB0aGUgY29kZSBzbmlwcGV0IGNvbnRlbnRzPC90aXRsZT48cGF0aCBmaWxsLXJ1bGU9XCJldmVub2RkXCIgZD1cIk0wIDYuNzVDMCA1Ljc4NC43ODQgNSAxLjc1IDVoMS41YS43NS43NSAwIDAxMCAxLjVoLTEuNWEuMjUuMjUgMCAwMC0uMjUuMjV2Ny41YzAgLjEzOC4xMTIuMjUuMjUuMjVoNy41YS4yNS4yNSAwIDAwLjI1LS4yNXYtMS41YS43NS43NSAwIDAxMS41IDB2MS41QTEuNzUgMS43NSAwIDAxOS4yNSAxNmgtNy41QTEuNzUgMS43NSAwIDAxMCAxNC4yNXYtNy41elwiPjwvcGF0aD48cGF0aCBmaWxsLXJ1bGU9XCJldmVub2RkXCIgZD1cIk01IDEuNzVDNSAuNzg0IDUuNzg0IDAgNi43NSAwaDcuNUMxNS4yMTYgMCAxNiAuNzg0IDE2IDEuNzV2Ny41QTEuNzUgMS43NSAwIDAxMTQuMjUgMTFoLTcuNUExLjc1IDEuNzUgMCAwMTUgOS4yNXYtNy41em0xLjc1LS4yNWEuMjUuMjUgMCAwMC0uMjUuMjV2Ny41YzAgLjEzOC4xMTIuMjUuMjUuMjVoNy41YS4yNS4yNSAwIDAwLjI1LS4yNXYtNy41YS4yNS4yNSAwIDAwLS4yNS0uMjVoLTcuNXpcIj48L3BhdGg+PC9zdmc+JztcbiAgICBjb25zdCBzdmdDaGVjayA9ICc8c3ZnIHJvbGU9XCJpbWdcIiBhcmlhLWhpZGRlbj1cInRydWVcIiBhcmlhLWxhYmVsbGVkYnk9XCJjbGlwYm9hcmRDaGVja21hcmtcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiB2ZXJzaW9uPVwiMS4xXCIgd2lkdGg9XCIxNlwiIGRhdGEtdmlldy1jb21wb25lbnQ9XCJ0cnVlXCI+PHRpdGxlIGlkPVwiY2xpcGJvYXJkQ2hlY2ttYXJrXCI+Q29kZSBzbmlwcGV0IGNvbnRlbnRzIGNvcGllZDwvdGl0bGU+PHBhdGggZmlsbC1ydWxlPVwiZXZlbm9kZFwiIGZpbGw9XCJyZ2IoNjMsIDE4NSwgODApXCIgZD1cIk0xMy43OCA0LjIyYS43NS43NSAwIDAxMCAxLjA2bC03LjI1IDcuMjVhLjc1Ljc1IDAgMDEtMS4wNiAwTDIuMjIgOS4yOGEuNzUuNzUgMCAwMTEuMDYtMS4wNkw2IDEwLjk0bDYuNzItNi43MmEuNzUuNzUgMCAwMTEuMDYgMHpcIj48L3BhdGg+PC9zdmc+JztcbiAgICBidXR0b24uY2xhc3NOYW1lID0gJ2NsaXBib2FyZC1idXR0b24nO1xuICAgIGJ1dHRvbi50eXBlID0gJ2J1dHRvbic7XG4gICAgYnV0dG9uLmlubmVySFRNTCA9IHN2Z0NvcHk7XG4gICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgbGV0IHRleHRUb0NvcHkgPSAnJztcbiAgICAgIGxldCBjb2RlQmxvY2tDaGlsZHJlbiA9IEFycmF5LmZyb20oY29kZUJsb2NrLmNoaWxkcmVuKVxuICAgICAgY29kZUJsb2NrQ2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihzcGFuKSB7XG4gICAgICAgIC8vIGxhc3RDaGlsZCBpcyByZXF1aXJlZCB0byBhdm9pZCBjb3B5aW5nIGxpbmUgbnVtYmVyc1xuICAgICAgICB0ZXh0VG9Db3B5ICs9IHNwYW4ubGFzdENoaWxkLmlubmVyVGV4dDtcbiAgICAgIH0pO1xuICAgICAgY2xpcGJvYXJkLndyaXRlVGV4dCh0ZXh0VG9Db3B5KS50aGVuKFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgYnV0dG9uLmJsdXIoKTtcbiAgICAgICAgICBidXR0b24uaW5uZXJIVE1MID0gc3ZnQ2hlY2s7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiAoYnV0dG9uLmlubmVySFRNTCA9IHN2Z0NvcHkpLCAyMDAwKTtcbiAgICAgICAgfSxcbiAgICAgICAgKGVycm9yKSA9PiAoYnV0dG9uLmlubmVySFRNTCA9ICdFcnJvcicpXG4gICAgICApO1xuICAgIH0pO1xuICAgIC8vIDMuIEFwcGVuZCB0aGUgYnV0dG9uIGRpcmVjdGx5IGJlZm9yZSB0aGUgcHJlIHRhZ1xuICAgIGNvbnN0IHByZSA9IGNvZGVCbG9jay5wYXJlbnROb2RlO1xuICAgIHByZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShidXR0b24sIHByZSk7XG4gIH0pO1xufTtcblxuY29uc3QgY2xpcGJvYXJkID0gKCgpID0+IHtcbiAgaWYgKG5hdmlnYXRvciAmJiBuYXZpZ2F0b3IuY2xpcGJvYXJkKSB7XG4gICAgYWRkQ29weUJ1dHRvbnMobmF2aWdhdG9yLmNsaXBib2FyZCk7XG4gIH1cbn0pKCk7XG5cbmV4cG9ydCB7IGNsaXBib2FyZCB9OyIsICJjb25zdCB0b2dnbGVUb2MgPSAoKCkgPT4ge1xuICBsZXQgdG9jVG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2pzLXRvYy10b2dnbGUnKTtcbiAgbGV0IHRvY0NvbnRlbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2pzLXRvYy1jb250ZW50cycpO1xuXG4gIGlmICh0b2NUb2dnbGUpIHtcbiAgICB0b2NUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICB0b2NDb250ZW50cy5jbGFzc0xpc3QudG9nZ2xlKCd0b2MtY29udGVudHMtLWFjdGl2ZScpO1xuICAgIH0pO1xuICB9XG59KSgpO1xuXG5leHBvcnQgeyB0b2dnbGVUb2MgfTsiLCAiLy8gU2hvdyBvciBoaWRlIG5hdiBvbiBjbGljayBvZiBtZW51IGJ1cmdlclxuZnVuY3Rpb24gdG9nZ2xlTmF2KCkge1xuICBsZXQgbWFpbk1lbnUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnanMtbWVudScpO1xuICBsZXQgbmF2QmFyVG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2pzLW5hdmJhci10b2dnbGUnKTtcblxuICBuYXZCYXJUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgbWFpbk1lbnUuY2xhc3NMaXN0LnRvZ2dsZSgnbWVudS0tYWN0aXZlJyk7XG4gICAgcmVtb3ZlU3ViTWVudXMoKTtcbiAgfSk7XG59XG5cbi8vIFNob3cgb3IgaGlkZSBtZW51IGl0ZW1zIG9uIG1vYmlsZVxuZnVuY3Rpb24gdG9nZ2xlTW9iaWxlTWVudSgpIHtcbiAgbGV0IG1lbnVJdGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tZW51LWl0ZW0nKTtcblxuICBtZW51SXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIGxldCBzdWJNZW51ID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuc3ViLW1lbnUnKTtcbiAgICAgIGlmIChzdWJNZW51LmNsYXNzTGlzdC5jb250YWlucygnc3ViLW1lbnUtLWFjdGl2ZScpKSB7XG4gICAgICAgIHN1Yk1lbnUuY2xhc3NMaXN0LnJlbW92ZSgnc3ViLW1lbnUtLWFjdGl2ZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVtb3ZlU3ViTWVudXMoKTtcbiAgICAgICAgc3ViTWVudS5jbGFzc0xpc3QuYWRkKCdzdWItbWVudS0tYWN0aXZlJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vLyBDb2xsYXBzZSBzdWJtZW51c1xuZnVuY3Rpb24gcmVtb3ZlU3ViTWVudXMoKSB7XG4gIGxldCBzdWJNZW51cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdWItbWVudScpO1xuICBzdWJNZW51cy5mb3JFYWNoKGZ1bmN0aW9uKHN1Yikge1xuICAgIGlmIChzdWIuY2xhc3NMaXN0LmNvbnRhaW5zKCdzdWItbWVudS0tYWN0aXZlJykpIHtcbiAgICAgIHN1Yi5jbGFzc0xpc3QucmVtb3ZlKCdzdWItbWVudS0tYWN0aXZlJyk7XG4gICAgfVxuICB9KTtcbn1cblxuY29uc3QgaGVhZGVyID0gKCgpID0+IHtcbiAgdG9nZ2xlTmF2KCk7XG4gIHRvZ2dsZU1vYmlsZU1lbnUoKTtcbn0pKCk7XG5cbmV4cG9ydCB7IGhlYWRlciB9OyIsICJmdW5jdGlvbiBmaWx0ZXJQb3N0cygpIHtcbiAgbGV0IHNlbGVjdFBvc3RzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbGVjdC1wb3N0cycpO1xuICBsZXQgZW50cmllcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wb3N0LWVudHJ5LWZpbHRlcicpO1xuICBpZiAoc2VsZWN0UG9zdHMpIHtcbiAgICBzZWxlY3RQb3N0cy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICBlbnRyaWVzLmZvckVhY2goZnVuY3Rpb24oZW50cnkpIHtcbiAgICAgICAgaWYgKGVudHJ5LmNsYXNzTGlzdC5jb250YWlucyhgZW50cnktLSR7c2VsZWN0UG9zdHMudmFsdWV9YCkgfCBzZWxlY3RQb3N0cy52YWx1ZSA9PT0gJ2FsbC1wb3N0cycpIHtcbiAgICAgICAgICBlbnRyeS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnRyeS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBob21lID0gKCgpID0+IHtcbiAgZmlsdGVyUG9zdHMoKTtcbn0pKCk7XG5cbmV4cG9ydCB7IGhvbWUgfTsiXSwKICAibWFwcGluZ3MiOiAiOztBQUVBLFdBQVMsY0FBYztBQUNyQixRQUFJLGNBQWMsU0FBUyxlQUFlLGFBQWE7QUFDdkQsUUFBSSxhQUFhO0FBT2YsVUFBUyxZQUFULFdBQXFCO0FBQ25CLFlBQUksU0FBUyxhQUFhLFFBQVEsYUFBYTtBQUMvQyxZQUFJLG9CQUFvQjtBQUN4QixZQUFJLFdBQVcsTUFBTTtBQUNuQiw4QkFBb0IsV0FBVztBQUFBLFFBQ2pDLE9BQU87QUFDTCw4QkFBb0IsT0FBTyxXQUFXLDhCQUE4QixFQUFFO0FBQUEsUUFDeEU7QUFFQSxvQkFBWSxVQUFVO0FBQ3RCLG1CQUFXO0FBQUEsTUFDYixHQUVTLGFBQVQsV0FBc0I7QUFDcEIsWUFBSSxZQUFZLFNBQVM7QUFDdkIsbUJBQVMsS0FBSyxhQUFhLGNBQWMsTUFBTTtBQUMvQyx1QkFBYSxRQUFRLGVBQWUsTUFBTTtBQUFBLFFBQzVDLE9BQU87QUFDTCxtQkFBUyxLQUFLLGdCQUFnQixZQUFZO0FBQzFDLHVCQUFhLFFB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
