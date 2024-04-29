document.addEventListener("alpine:init", () => {
  Alpine.data(
    "menu",
    (/** @type {{open: boolean}} */ options = { open: false }) => {
      let pointer = useTrackedPointer();

      return {
        open: options.open,
        items: null,
        activeDescendant: null,
        activeIndex: null,
        init() {
          this.items = Array.from(
            this.$el.querySelectorAll('[role="menuitem"]'),
          );
          this.$watch("open", () => {
            if (this.open) {
              this.activeIndex = -1;
            }
          });
          this.$watch("activeIndex", () => {
            this.activeDescendant =
              this.activeIndex === -1 && !!this.items?.length
                ? null
                : this.items[this.activeIndex].id;
          });
        },
        focusButton() {
          this.$refs.button.focus();
        },
        onButtonClick() {
          this.open = !this.open;
          if (this.open) {
            this.$nextTick(() => {
              this.$refs["menu-items"].focus();
            });
          }
        },
        onButtonEnter() {
          this.open = !this.open;
          if (this.open) {
            this.activeIndex = 0;
            this.$nextTick(() => {
              this.$refs["menu-items"].focus();
            });
          }
        },
        onArrowUp() {
          if (!this.open) {
            this.open = true;
            this.activeIndex = this.items.length - 1;
            return;
          }

          if (this.activeIndex === 0) {
            return;
          }

          this.activeIndex =
            this.activeIndex === -1
              ? this.items.length - 1
              : this.activeIndex - 1;
        },
        onArrowDown() {
          if (!this.open) {
            this.open = true;
            this.activeIndex = 0;
            return;
          }

          if (this.activeIndex === this.items.length - 1) {
            return;
          }

          this.activeIndex = this.activeIndex + 1;
        },
        onClickAway($event) {
          if (this.open) {
            const focusableSelector = [
              "[contentEditable=true]",
              "[tabindex]",
              "a[href]",
              "area[href]",
              "button:not([disabled])",
              "iframe",
              "input:not([disabled])",
              "select:not([disabled])",
              "textarea:not([disabled])",
            ]
              .map((selector) => `${selector}:not([tabindex='-1'])`)
              .join(",");

            this.open = false;
            if (!$event.target.closest(focusableSelector)) {
              this.focusButton();
            }
          }
        },

        onMouseEnter(evt) {
          pointer.update(evt);
        },
        onMouseMove(evt, newIndex) {
          // Only highlight when the cursor has moved
          // Pressing arrow keys can otherwise scroll the container and override the selected item
          if (!pointer.wasMoved(evt)) return;
          this.activeIndex = newIndex;
        },
        onMouseLeave(evt) {
          // Only unhighlight when the cursor has moved
          // Pressing arrow keys can otherwise scroll the container and override the selected item
          if (!pointer.wasMoved(evt)) return;
          this.activeIndex = -1;
        },
        menuContainer: {
          ["@keydown.escape.stop"]() {
            this.open = false;
            this.focusButton();
          },
          ["@click.outside"]() {
            this.onClickAway(this.$event);
          },
        },
        menuButton: {
          ["x-ref"]: "button",
          ["@click"]() {
            this.onButtonClick();
          },
          ["@keyup.space.prevent"]() {
            this.onButtonEnter();
          },
          ["@keydown.enter.prevent"]() {
            this.onButtonEnter();
          },
          [":aria-expanded"]() {
            return this.open.toString();
          },
          ["@keydown.up.prevent"]() {
            this.onArrowUp();
          },
          ["@keydown.down.prevent"]() {
            this.onArrowDown();
          },
        },
        menuItems: {
          ["x-ref"]: "menu-items",
          ["x-show"]() {
            return this.open;
          },
          [":aria-activedescendant"]() {
            return this.activeDescendant;
          },
          ["@keydown.up.prevent"]() {
            this.onArrowUp();
          },
          ["@keydown.down.prevent"]() {
            this.onArrowDown();
          },
          ["@keydown.tab"]() {
            this.open = false;
          },
          ["@keydown.enter.prevent"]() {
            this.open = false;
            this.focusButton();
          },
          ["@keydown.space.prevent"]() {
            this.open = false;
            this.focusButton();
          },
        },
        menuItem: {
          ["@mouseenter"]() {
            this.onMouseEnter(this.$event);
          },
          ["@mousemove"]() {
            this.onMouseMove(this.$event, this.$el.dataset.index);
          },
          ["@mouseleave"]() {
            this.onMouseLeave(this.$event);
          },
          ["@click"]() {
            this.open = false;
            this.focusButton();
          },
          [":id"]() {
            return `menu-item-${this.$el.dataset.index}`;
          },
        },
      };
    },
  );
});

function useTrackedPointer() {
  /** @type {[x: number, y: number]} */
  let lastPos = [-1, -1];

  return {
    /**
     * @param {PointerEvent} evt
     */
    wasMoved(evt) {
      let newPos = [evt.screenX, evt.screenY];

      if (lastPos[0] === newPos[0] && lastPos[1] === newPos[1]) {
        return false;
      }

      lastPos = newPos;
      return true;
    },

    /**
     * @param {PointerEvent} evt
     */
    update(evt) {
      lastPos = [evt.screenX, evt.screenY];
    },
  };
}
