import * as React from 'react'
import {
    withEffects,
    Handler,
    ObservableComponent,
    PropEffect
} from '../../../../packages/refract-rxjs/src'
import {
    aperture,
    toPropsAperture,
    asPropsAperture,
    Effect,
    Props,
    createRenderingAperture
} from './aperture'
import { mount } from 'enzyme'

describe('refract-rxjs', () => {
    const noop = (...args) => void 0

    const handler: Handler<Props, Effect> = props => (value: Effect) => {
        noop(value)
    }

    it('should create a HoC', () => {
        const WithEffects = withEffects<Props, Effect>(handler)(aperture)(
            () => <div />
        )
    })

    it('should observe component changes', () => {
        const effectValueHandler = jest.fn()
        const setValue = () => void 0
        const WithEffects = withEffects<Props, Effect>(
            () => effectValueHandler
        )(aperture)(({ setValue, pushEvent }) => (
            <div>
                <button onClick={() => setValue(10)} />
                <a onClick={pushEvent('linkClick')} />
            </div>
        ))

        const component = mount(<WithEffects value={1} setValue={setValue} />)

        expect(component.prop('value')).toBe(1)
        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'ValueChange',
            value: 1
        })

        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'Start'
        })

        component.setProps({ value: 2 })
        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'ValueChange',
            value: 2
        })

        component.find('button').simulate('click')

        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'ValueSet',
            value: 10
        })

        component.setProps({ setValue: () => void 0 })
        component.find('button').simulate('click')

        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'ValueSet',
            value: 10
        })

        component.find('a').simulate('click')

        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'LinkClick'
        })

        component.unmount()

        expect(effectValueHandler).toHaveBeenCalledWith({
            type: 'Stop'
        })
    })

    it('should map props to wrapped component', () => {
        interface Props {
            prop: string
        }
        interface ChildProps {
            newProp: string
        }
        const BaseComponent = jest.fn().mockReturnValue(<div />)
        const hander = () => () => void 0
        const WithEffects = withEffects<Props, PropEffect, ChildProps>(hander)(
            asPropsAperture
        )(BaseComponent)

        const node = mount(<WithEffects prop="hello" />)

        let props = BaseComponent.mock.calls[0][0]

        expect(props.prop).toBeUndefined()
        expect(props.newProp).toBe('hello world')

        node.setProps({
            prop: 'this'
        })

        props = BaseComponent.mock.calls[1][0]

        expect(props.prop).toBeUndefined()
        expect(props.newProp).toBe('this world')
    })

    it('should add props to wrapped component', () => {
        interface Props {
            prop: string
        }
        interface ChildProps {
            prop: string
            newProp: string
        }
        const BaseComponent = jest.fn().mockReturnValue(<div />)
        const hander = () => () => void 0
        const WithEffects = withEffects<Props, PropEffect, ChildProps>(hander)(
            toPropsAperture
        )(BaseComponent)

        const node = mount(<WithEffects prop="hello" />)

        let props = BaseComponent.mock.calls[0][0]

        expect(props.prop).toBe('hello')
        expect(props.newProp).toBe('hello world')

        node.setProps({
            prop: 'this'
        })

        props = BaseComponent.mock.calls[1][0]

        expect(props.prop).toBe('this')
        expect(props.newProp).toBe('this world')
    })

    it('should render virtual elements', () => {
        const hander = () => () => void 0
        interface Props {
            prop: string
        }
        const aperture = createRenderingAperture<React.ReactNode>(prop => (
            <div>{prop}</div>
        ))
        const WithEffects = withEffects<Props, React.ReactNode>(hander)(
            aperture
        )()

        const node = mount(<WithEffects prop="hello" />)

        expect(node.text()).toBe('hello')
        expect(node.find('div').exists()).toBe(true)

        node.setProps({
            prop: 'hi'
        })

        expect(node.text()).toBe('hi')
    })
})
